import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { DIRECTION_HOME, selectCases, TARGETS } from "../inventory.js";

export const HIGH_RISK_ROWS = new Set([
  "carousel",
  "color-picker",
  "progress",
  "switch",
  "combobox",
  "tooltip",
  "sidebar",
  "context-menu",
  "dropdown",
  "hover-card",
  "menu",
  "drawer",
  "preview-card",
  "navigation-menu",
  "popover",
  "scroll-area",
  "select",
  "sheet",
  "slider",
  "tabs",
  "dialog",
  "alert-dialog",
]);

export const FIXED_CI_SHARDS = [
  "fixtures-controls",
  "fixtures-composites",
  "fixtures-surfaces",
  "legacy-baseline",
  "harness-smoke",
];
export const SOURCE_CI_SHARD = "source-cases";

/** The source shard contains every case outside the original fixed CI cohorts. */
export function planCiShards(inventory) {
  assert(
    !inventory.cases.some((item) => item.id === SOURCE_CI_SHARD) &&
      !inventory.cohorts.some((item) => item.cohort === SOURCE_CI_SHARD),
    `${SOURCE_CI_SHARD} is reserved for CI selection`,
  );
  const owned = new Set();
  const shards = FIXED_CI_SHARDS.map((slug) => {
    const caseIds = selectCases(slug, inventory.cases, inventory.cohorts).map((item) => item.id);
    for (const id of caseIds) {
      assert(!owned.has(id), `Overlapping CI shard case ${id}`);
      owned.add(id);
    }
    return { slug, caseIds };
  });
  const sourceCaseIds = inventory.cases
    .filter((item) => !owned.has(item.id))
    .map((item) => item.id);
  return [...shards, { slug: SOURCE_CI_SHARD, caseIds: sourceCaseIds }];
}

export function plannedEngines(item) {
  if (item.id === "direction-service-live-owner") return ["chromium", "firefox", "webkit"];
  const row = item.row.replace(/^(runtime:|legacy:)/, "");
  return HIGH_RISK_ROWS.has(row) ? ["chromium", "firefox", "webkit"] : ["chromium"];
}

export function checkKey(caseId, target, engine, assertionId) {
  return `${caseId}\u001f${target}\u001f${engine}\u001f${assertionId}`;
}

export function resultKey(caseId, target, engine) {
  return `${caseId}\u001f${target}\u001f${engine}`;
}

export async function loadExpectedFailures(home = DIRECTION_HOME) {
  const dir = path.join(home, "staging/expected");
  const files = (await readdir(dir)).filter((name) => name.endsWith(".json")).sort();
  const entries = [];
  for (const name of files) {
    const data = JSON.parse(await readFile(path.join(dir, name), "utf8"));
    assert.equal(name, `${data.remediation}.json`, `${name} remediation slug`);
    assert(Array.isArray(data.expectedFailures), `${name} expectedFailures`);
    for (const entry of data.expectedFailures) {
      assert.equal(entry.remediation, data.remediation, `${name} entry remediation`);
      entries.push(entry);
    }
  }
  return entries;
}

export async function loadRemediationBaselines(home = DIRECTION_HOME) {
  return JSON.parse(await readFile(path.join(home, "runner/remediation-baselines.json"), "utf8"));
}

export function validateRemediationBaselines(mapping, cases) {
  const caseIds = new Set(cases.map((item) => item.id));
  const slugs = new Set();
  for (const [ticket, owner] of Object.entries(mapping)) {
    assert(/^ticket-(0[7-9]|1\d|2\d)$/.test(ticket), `Unknown remediation ticket ${ticket}`);
    assert(/^[a-z][a-z0-9-]+$/.test(owner.slug), `Invalid remediation slug ${ticket}`);
    assert(!slugs.has(owner.slug), `Duplicate remediation slug ${owner.slug}`);
    slugs.add(owner.slug);
    assert(Array.isArray(owner.baselineCaseIds), `${ticket} baseline cases must be an array`);
    assert.equal(
      new Set(owner.baselineCaseIds).size,
      owner.baselineCaseIds.length,
      `${ticket} duplicate baseline case`,
    );
    for (const id of owner.baselineCaseIds)
      assert(caseIds.has(id), `${ticket} unknown baseline case ${id}`);
  }
  return mapping;
}

export function validateExpectedFailures(entries, cases) {
  const casesById = new Map(cases.map((item) => [item.id, item]));
  const keys = new Set();
  for (const entry of entries) {
    const { caseId, row, target, engine, assertionId, acceptance, remediation } = entry;
    const item = casesById.get(caseId);
    assert(item, `Unknown expected-failure case ${caseId}`);
    assert.equal(row, item.row, `Expected-failure row for ${caseId}`);
    assert(TARGETS.includes(target), `Unknown expected-failure target ${target}`);
    assert(item.fixtures[target], `Unavailable expected-failure target ${caseId}/${target}`);
    assert(
      item.fixtures[target].assertions.includes(assertionId),
      `Unknown expected-failure check ${caseId}/${target}/${assertionId}`,
    );
    assert(
      plannedEngines(item).includes(engine),
      `Unplanned expected-failure engine ${caseId}/${engine}`,
    );
    assert(
      Array.isArray(acceptance) && acceptance.length,
      `Missing AC for ${caseId}/${assertionId}`,
    );
    for (const ac of acceptance)
      assert(/^SPEC-AC-(0[1-9]|1[0-7])$/.test(ac), `Unknown acceptance criterion ${ac}`);
    assert(/^ticket-\d{2}$/.test(remediation), `Invalid remediation ${remediation}`);
    const key = checkKey(caseId, target, engine, assertionId);
    assert(!keys.has(key), `Duplicate expected-failure owner ${key}`);
    keys.add(key);
  }
  return keys;
}

export function selectStageCases(slug, inventory, remediationBaselines) {
  if (!slug) return inventory.cases;
  if (slug === SOURCE_CI_SHARD) {
    const source = planCiShards(inventory).find((shard) => shard.slug === SOURCE_CI_SHARD);
    const ids = new Set(source.caseIds);
    return inventory.cases.filter((item) => ids.has(item.id));
  }
  const direct = selectCases(slug, inventory.cases, inventory.cohorts);
  const owner = Object.entries(remediationBaselines).find(
    ([ticket, entry]) => slug === ticket || slug === entry.slug,
  );
  if (!owner) {
    assert(direct.length, `No direction case or remediation matches ${slug}`);
    return direct;
  }
  const [ticket, entry] = owner;
  const ids = new Set([
    ...entry.baselineCaseIds,
    ...direct.map((item) => item.id),
    ...selectCases(ticket, inventory.cases, inventory.cohorts).map((item) => item.id),
    ...selectCases(entry.slug, inventory.cases, inventory.cohorts).map((item) => item.id),
  ]);
  const selected = inventory.cases.filter((item) => ids.has(item.id));
  assert(selected.length, `No direction case for ${slug}`);
  assert.equal(selected.length, ids.size, `Missing direction case for ${slug}`);
  return selected;
}

export function compareStage(
  cases,
  results,
  expectedFailures,
  engines = ["chromium", "firefox", "webkit"],
) {
  const selectedIds = new Set(cases.map((item) => item.id));
  const expected = expectedFailures.filter(
    (entry) => selectedIds.has(entry.caseId) && engines.includes(entry.engine),
  );
  validateExpectedFailures(expected, cases);
  const expectedByKey = new Map(
    expected.map((entry) => [
      checkKey(entry.caseId, entry.target, entry.engine, entry.assertionId),
      entry,
    ]),
  );
  const seenResults = new Set();
  const seenChecks = new Set();
  const issues = [];
  const checkResults = [];
  const required = new Map();
  for (const item of cases)
    for (const target of TARGETS)
      if (item.fixtures[target])
        for (const engine of plannedEngines(item))
          if (engines.includes(engine)) required.set(resultKey(item.id, target, engine), item);
  for (const result of results) {
    const rkey = resultKey(result.caseId, result.target, result.engine);
    const item = required.get(rkey);
    if (!item) {
      issues.push({ type: "unexpected-result", result: rkey });
      continue;
    }
    if (seenResults.has(rkey)) {
      issues.push({ type: "duplicate-result", result: rkey });
      continue;
    }
    seenResults.add(rkey);
    if (result.row !== item.row) issues.push({ type: "row-drift", result: rkey });
    if (result.errors?.length)
      issues.push({ type: "runner-error", result: rkey, errors: result.errors });
    const declared = item.fixtures[result.target].assertions;
    const actualChecks = new Map();
    for (const check of result.checks ?? []) {
      if (actualChecks.has(check.name))
        issues.push({ type: "duplicate-check", result: rkey, assertionId: check.name });
      actualChecks.set(check.name, check);
      if (!declared.includes(check.name))
        issues.push({ type: "unknown-check", result: rkey, assertionId: check.name });
    }
    for (const assertionId of declared) {
      const check = actualChecks.get(assertionId);
      const key = checkKey(result.caseId, result.target, result.engine, assertionId);
      const owner = expectedByKey.get(key);
      seenChecks.add(key);
      if (!check || check.status === "unrun") {
        issues.push({ type: "unexecuted-check", result: rkey, assertionId });
      } else if (check.status === "failed" && !owner) {
        issues.push({ type: "unexpected-failure", result: rkey, assertionId, error: check.error });
      } else if (check.status === "passed" && owner) {
        issues.push({
          type: "stale-expected-failure",
          result: rkey,
          assertionId,
          remediation: owner.remediation,
        });
      } else if (!["passed", "failed"].includes(check.status)) {
        issues.push({
          type: "unknown-check-status",
          result: rkey,
          assertionId,
          status: check.status,
        });
      }
      checkResults.push({
        caseId: result.caseId,
        row: item.row,
        target: result.target,
        engine: result.engine,
        assertionId,
        actual: check?.status ?? "missing",
        expected: owner ? "failed" : "passed",
        remediation: owner?.remediation,
        acceptance: owner?.acceptance,
      });
    }
  }
  for (const key of required.keys())
    if (!seenResults.has(key)) issues.push({ type: "missing-result", result: key });
  for (const entry of expected) {
    const key = checkKey(entry.caseId, entry.target, entry.engine, entry.assertionId);
    if (!seenChecks.has(key)) issues.push({ type: "missing-expected-failure", key });
  }
  return {
    status: issues.length ? "failed" : "passed",
    issues,
    checks: checkResults,
    expectedFailures: expected.length,
    observedExpectedFailures: checkResults.filter(
      (check) => check.expected === "failed" && check.actual === "failed",
    ).length,
    requiredResults: required.size,
    executedResults: seenResults.size,
  };
}
