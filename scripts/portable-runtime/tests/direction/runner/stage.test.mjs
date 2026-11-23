import assert from "node:assert/strict";
import { test } from "vitest";
import { legacyEvidence, validateLegacyPaintMeasurements } from "../cases/legacy-baseline/index.ts";
import { validateInventory } from "../inventory.ts";
import { partitionCases, verifyInstalled, verifySealedPacks, verifyUnion } from "./promotion.mjs";
import {
  compareStage,
  FIXED_CI_SHARDS,
  loadRemediationBaselines,
  planCiShards,
  plannedEngines,
  SOURCE_CI_SHARD,
  selectStageCases,
  validateExpectedFailures,
  validateRemediationBaselines,
} from "./stage.mjs";

const caseA = {
  id: "sample-a",
  row: "tabs",
  acceptance: ["SPEC-AC-01"],
  fixtures: {
    astro: {
      source: "<button>A</button>",
      exports: [],
      assertions: ["known-red", "ordinary-check"],
    },
  },
};
const caseB = {
  id: "sample-b",
  row: "slider",
  acceptance: ["SPEC-AC-01"],
  fixtures: { astro: { source: "<button>B</button>", exports: [], assertions: ["healthy-check"] } },
};
const red = {
  caseId: "sample-a",
  row: "tabs",
  target: "astro",
  engine: "chromium",
  assertionId: "known-red",
  acceptance: ["SPEC-AC-01"],
  remediation: "ticket-12",
};
const a = {
  caseId: "sample-a",
  row: "tabs",
  target: "astro",
  engine: "chromium",
  checks: [
    { name: "known-red", status: "failed", error: "observed paint" },
    { name: "ordinary-check", status: "passed" },
  ],
  errors: [],
  observations: { bounds: { x: 12 } },
};
const b = {
  caseId: "sample-b",
  row: "slider",
  target: "astro",
  engine: "chromium",
  checks: [{ name: "healthy-check", status: "passed" }],
  errors: [],
};

const compare = (results, failures = [red]) =>
  compareStage([caseA, caseB], results, failures, ["chromium"]);

test("known red receipts and ordinary passing checks close staging", () => {
  const report = compare([a, b]);
  assert.equal(report.status, "passed");
  assert.equal(report.observedExpectedFailures, 1);
  assert.equal(report.checks.length, 3);
});

test("an injected failure beside a known red check stays unexpected", () => {
  const report = compare([
    {
      ...a,
      checks: [a.checks[0], { name: "ordinary-check", status: "failed", error: "injected" }],
    },
    b,
  ]);
  assert(
    report.issues.some(
      (issue) => issue.type === "unexpected-failure" && issue.assertionId === "ordinary-check",
    ),
  );
  assert.equal(report.observedExpectedFailures, 1);
});

test("stale pass, missing result, unrun check and runner error each fail", () => {
  assert(
    compare([
      { ...a, checks: [{ name: "known-red", status: "passed" }, a.checks[1]] },
      b,
    ]).issues.some((x) => x.type === "stale-expected-failure"),
  );
  assert(compare([a]).issues.some((x) => x.type === "missing-result"));
  assert(
    compare([
      { ...a, checks: [a.checks[0], { name: "ordinary-check", status: "unrun" }] },
      b,
    ]).issues.some((x) => x.type === "unexecuted-check"),
  );
  assert(
    compare([{ ...a, errors: ["page crashed"] }, b]).issues.some((x) => x.type === "runner-error"),
  );
});

test("fabricated, duplicate and unknown failure owners are rejected", () => {
  assert(compare([a, b], []).issues.some((x) => x.type === "unexpected-failure"));
  assert.throws(
    () => validateExpectedFailures([red, red], [caseA, caseB]),
    /Duplicate expected-failure owner/,
  );
  assert.throws(
    () => validateExpectedFailures([{ ...red, assertionId: "missing" }], [caseA, caseB]),
    /Unknown expected-failure check/,
  );
  assert.throws(
    () => validateExpectedFailures([{ ...red, row: "other" }], [caseA, caseB]),
    /Expected-failure row/,
  );
  assert.doesNotThrow(() =>
    validateExpectedFailures([{ ...red, acceptance: ["SPEC-AC-17"] }], [caseA, caseB]),
  );
  assert.throws(
    () => validateExpectedFailures([{ ...red, acceptance: ["SPEC-AC-18"] }], [caseA, caseB]),
    /Unknown acceptance criterion/,
  );
  assert(
    compare([
      { ...a, checks: [...a.checks, { name: "unknown", status: "failed" }] },
      b,
    ]).issues.some((x) => x.type === "unknown-check"),
  );
});

test("remediation selects existing baseline cases without a new case module", () => {
  const inventory = { cases: [caseA, caseB], cohorts: [] };
  const mapping = { "ticket-12": { slug: "collection-keys", baselineCaseIds: ["sample-a"] } };
  assert.deepEqual(
    selectStageCases("ticket-12", inventory, mapping).map((item) => item.id),
    ["sample-a"],
  );
});

test("ticket slug and number retain baselines after the last red is removed", () => {
  const authored = { ...caseB, id: "collection-keys" };
  const inventory = { cases: [caseA, authored], cohorts: [] };
  const mapping = { "ticket-12": { slug: "collection-keys", baselineCaseIds: ["sample-a"] } };
  for (const slug of ["ticket-12", "collection-keys"])
    assert.deepEqual(
      selectStageCases(slug, inventory, mapping).map((item) => item.id),
      ["sample-a", "collection-keys"],
    );
  assert.equal(
    compareStage(
      [caseA],
      [{ ...a, checks: [{ name: "known-red", status: "passed" }, a.checks[1]] }],
      [],
      ["chromium"],
    ).status,
    "passed",
  );
});

test("checked-in mapping preserves CI cohorts and ticket 15 baselines", async () => {
  const inventory = await validateInventory("final");
  const mapping = validateRemediationBaselines(await loadRemediationBaselines(), inventory.cases);
  assert.equal(selectStageCases("fixtures-controls", inventory, mapping).length, 30);
  assert.equal(selectStageCases("fixtures-surfaces", inventory, mapping).length, 33);
  for (const slug of ["ticket-15", "slider-mapping"])
    assert.deepEqual(
      selectStageCases(slug, inventory, mapping).map((item) => item.id),
      ["surface-raw-slider", "surface-slider", "slider-mapping-runtime"],
    );
});

test("CI source shard includes a future direct case and handles an empty complement", () => {
  const cohorts = FIXED_CI_SHARDS.filter((slug) => slug !== "harness-smoke").map(
    (cohort, index) => ({ cohort, caseIds: [`fixed-${index}`] }),
  );
  const fixedCases = [
    ...cohorts.map((cohort) => ({ ...caseB, id: cohort.caseIds[0] })),
    { ...caseB, id: "harness-smoke" },
  ];
  const empty = { cases: fixedCases, cohorts };
  assert.deepEqual(planCiShards(empty).at(-1), { slug: SOURCE_CI_SHARD, caseIds: [] });
  assert.deepEqual(selectStageCases(SOURCE_CI_SHARD, empty, {}), []);

  const future = { ...caseB, id: "future-source-case" };
  const extended = { cases: [...fixedCases, future], cohorts };
  assert.deepEqual(planCiShards(extended).at(-1), {
    slug: SOURCE_CI_SHARD,
    caseIds: ["future-source-case"],
  });
  assert.deepEqual(
    selectStageCases(SOURCE_CI_SHARD, extended, {}).map((item) => item.id),
    ["future-source-case"],
  );
  assert.deepEqual(planCiShards({ cases: [future], cohorts: [] }).at(-1)?.caseIds, [future.id]);
  const overlapping = {
    cases: fixedCases,
    cohorts: cohorts.map((cohort, index) =>
      index === 1 ? { ...cohort, caseIds: [cohorts[0].caseIds[0]] } : cohort,
    ),
  };
  assert.throws(() => planCiShards(overlapping), /Overlapping CI shard case/);
});

test("shard union covers the full live inventory once", async () => {
  const inventory = await validateInventory("final");
  const shards = planCiShards(inventory);
  const caseIds = shards.flatMap((shard) => shard.caseIds);
  assert.equal(new Set(caseIds).size, caseIds.length);
  assert.deepEqual(caseIds.slice().sort(), inventory.cases.map((item) => item.id).sort());
  assert(shards.at(-1).caseIds.includes("direction-service-live-owner"));

  const slices = partitionCases(inventory.cases);
  assert.deepEqual(
    slices
      .flat()
      .map((item) => item.id)
      .sort(),
    inventory.cases.map((item) => item.id).sort(),
  );
});

test("native direction service uses three engines without expanding other raw rows", () => {
  assert.deepEqual(
    plannedEngines({ id: "direction-service-live-owner", row: "runtime:radio-group" }),
    ["chromium", "firefox", "webkit"],
  );
  assert.deepEqual(plannedEngines({ id: "surface-raw-radio-group", row: "runtime:radio-group" }), [
    "chromium",
  ]);
});

test("a corrected legacy edge passes the historical observation gate", () => {
  const defect = {
    measuredEdges: {
      "ordinary-rtl": { expected: "physical-left", observed: "physical-right" },
      "nested-rtl-in-ltr": { expected: "physical-left", observed: "physical-right" },
    },
  };
  const current = ["ordinary-rtl", "nested-rtl-in-ltr"].map((scope) => ({
    scope,
    paint: { expectedInlineEnd: "physical-left", actualEdge: "physical-left", defect: false },
  }));
  assert.doesNotThrow(() => validateLegacyPaintMeasurements("switch", defect, current));
  assert.notEqual(
    legacyEvidence.find((item) => item.id === "switch").sourceRevision,
    "d2720e94f8c50f251e13ca8af2ba3a336b56e740",
  );
});

test("the union rejects missing shards, engines and individual assertions", () => {
  const sha = "source";
  for (const id of ["inventory", "runtime", "framework", "ssr", "styled", "delivery"]) {
    const fixture = { ...caseA, id, row: "switch" };
    const valid = {
      sha,
      status: "passed",
      caseIds: [id],
      results: ["chromium", "firefox", "webkit"].map((engine) => ({
        caseId: id,
        row: "switch",
        target: "astro",
        engine,
        status: "passed",
        checks: fixture.fixtures.astro.assertions.map((name) => ({ name, status: "passed" })),
      })),
    };
    verifyUnion([fixture], [valid], sha);
    const chromiumOnly = { ...valid, results: valid.results.slice(0, 1) };
    verifyUnion([fixture], [chromiumOnly], sha, ["chromium"]);
    assert.throws(() => verifyUnion([fixture], [chromiumOnly], sha));
    for (const change of [
      (r) => r.results.pop(),
      (r) => r.results[0].checks.pop(),
      (r) => (r.results[0].checks[0].status = "skipped"),
      (r) => (r.results[0].checks[0].status = "failed"),
      (r) => (r.sha = "other"),
    ]) {
      const mutated = structuredClone(valid);
      change(mutated);
      assert.throws(() => verifyUnion([fixture], [mutated], sha));
    }
  }
  assert.throws(() => verifyInstalled({ sourceSha: sha, archiveHashes: {} }, {}, {}, sha));
});

test("a mixed release archive cannot enter the sealed installed-host job", () => {
  const seal = {
    sourceCommit: "revision",
    sourceFingerprint: "fingerprint",
    manifestSha256: "manifest",
    packages: { cli: "fourth" },
  };
  const packs = {
    sourceSha: "revision",
    sourceFingerprint: "fingerprint",
    manifestHash: "manifest",
    archiveHashes: { cli: "third" },
  };
  assert.throws(() => verifySealedPacks(seal, packs), /archive byte hashes/);
  verifySealedPacks(seal, { ...packs, archiveHashes: seal.packages });
});
