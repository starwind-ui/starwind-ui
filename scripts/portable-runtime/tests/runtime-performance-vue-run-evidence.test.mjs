import { describe, expect, it, vi } from "vitest";

import { createRuntimePerformanceResult } from "../runtime-performance/model.mjs";
import { zagVueExpectedResolvedVersions } from "../package-size-vue-plan.mjs";
import {
  VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  rekaUiExpectedResolvedVersions,
  vuePerformanceProviderRows,
} from "../runtime-performance/vue-plan.mjs";
import {
  assertVuePerformanceEligibilityForRun,
  buildVuePerformanceEvidence,
  buildVuePerformanceRowRecord,
  checkVuePerformanceEvidence,
  createVuePerformanceAudit,
  createVuePerformanceEligibility,
  createVuePerformanceRun,
  publishVuePerformanceRow,
  publishVuePerformanceEvidence,
  serializeVuePerformanceEvidence,
  validateVuePerformanceEvidence,
  validateVuePerformanceRowRecord,
  VUE_PERFORMANCE_BASELINE_CONTROLS,
  VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL,
} from "../runtime-performance/vue-run-evidence.mjs";

const audit = createVuePerformanceAudit({
  contents: "reviewed audit",
  source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
});
const machine = { cpuModel: "Test CPU", logicalCoreCount: 8 };

describe("Vue performance row evidence", () => {
  it("pins the canonical 63 rows and audited exclusions", () => {
    const ids = vuePerformanceProviderRows.map(({ id }) => id);
    expect(ids).toHaveLength(63);
    expect(ids.filter((id) => id.endsWith(":starwind-vue"))).toHaveLength(22);
    expect(ids.filter((id) => id.endsWith(":zag-vue"))).toHaveLength(22);
    expect(ids.filter((id) => id.endsWith(":reka-ui"))).toHaveLength(19);
    expect(ids).not.toEqual(
      expect.arrayContaining([
        "select-item-highlight:reka-ui",
        "select-trigger-mount:reka-ui",
        "combobox-filter-input:reka-ui",
        "navigation-menu-content-switch:reka-ui",
      ]),
    );
  });

  it("pins zero warmups and exactly five samples for every row", () => {
    expect(VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL).toEqual({
      browserLifecycle: "one context, page, CDP session, and navigation per mount row",
      iterations: 5,
      warmupCount: 0,
    });
    expect(VUE_PERFORMANCE_BASELINE_CONTROLS.rows).toHaveLength(63);
    expect(
      VUE_PERFORMANCE_BASELINE_CONTROLS.rows.every(
        ({ warmupCount, withinRunSampleCount }) => warmupCount === 0 && withinRunSampleCount === 5,
      ),
    ).toBe(true);
  });

  it("builds one stable atomic row and omits Vue p95", () => {
    const record = makeRecord();
    expect(record.id).toBe("dialog-open:starwind-vue");
    expect(record.result.samples).toHaveLength(5);
    expect(record.result).not.toHaveProperty("p95Ms");
    expect(record.stability.stable).toBe(true);
    expect(record.candidate).toEqual(
      expect.objectContaining({ blocking: false, reason: null, status: "ceiling-available" }),
    );
    expect(validateVuePerformanceRowRecord(record, { requireBaselinePlatform: false })).toEqual(
      record,
    );
  });

  it("accepts unstable rows and withholds only the unstable Starwind ceiling", () => {
    const stable = makeRecord();
    const { ceilingMs: _ceilingMs, ...candidateWithoutCeiling } = stable.candidate;
    expect(() =>
      validateVuePerformanceRowRecord(
        { ...stable, candidate: candidateWithoutCeiling },
        { requireBaselinePlatform: false },
      ),
    ).toThrow("does not match raw samples");

    const unstable = makeRecord({ samples: [1, 1, 1, 1, 100] });
    expect(unstable.stability.stable).toBe(false);
    expect(unstable.candidate).toEqual({
      blocking: false,
      id: unstable.id,
      reason: "Within-row stability limits were exceeded, so no candidate ceiling was calculated.",
      status: "unstable-no-ceiling",
    });
    expect(validateVuePerformanceRowRecord(unstable, { requireBaselinePlatform: false })).toEqual(
      unstable,
    );
    expect(() =>
      validateVuePerformanceRowRecord(
        { ...unstable, candidate: { ...unstable.candidate, ceilingMs: 101 } },
        { requireBaselinePlatform: false },
      ),
    ).toThrow("does not match raw samples");

    const comparator = makeRecord({
      id: "dialog-open:zag-vue",
      samples: [1, 1, 1, 1, 100],
    });
    expect(comparator.stability.stable).toBe(false);
    expect(comparator.candidate).toBeNull();
  });

  it("rejects wrong sample counts, metrics, controls, and lifecycle failures", () => {
    expect(() => makeRecord({ samples: [1, 1, 1, 1] })).toThrow("sample or metric");
    expect(() => makeRecord({ metric: "wrong" })).toThrow("sample or metric");
    expect(() => makeRecord({ lifecycle: { endpointVisible: false } })).toThrow("lifecycle failed");
    expect(() =>
      makeRecord({
        flags: flags("dialog-open:starwind-vue", {
          mountSampling: { ...VUE_PERFORMANCE_MOUNT_SAMPLING_CONTROL, iterations: 100 },
        }),
      }),
    ).toThrow("flags differ");
  });

  it("requires exact package and machine identity", () => {
    for (const name of ["vite", "playwright", "@vitejs/plugin-vue"]) {
      const packageVersions = { ...environment().packageVersions };
      delete packageVersions[name];
      expect(() => makeRecord({ environment: environment({ packageVersions }) })).toThrow(name);
    }
    expect(() => makeRecord({ machine: { cpuModel: "", logicalCoreCount: 8 } })).toThrow(
      "cpuModel",
    );
  });

  it("publishes one validated row transactionally", () => {
    const writeArtifacts = vi.fn();
    const record = makeRecord();
    publishVuePerformanceRow({ record, rowPath: "/private/rows/dialog.json", writeArtifacts });
    expect(writeArtifacts).toHaveBeenCalledOnce();
    expect(writeArtifacts.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        content: serializeVuePerformanceEvidence(record),
        path: "/private/rows/dialog.json",
      }),
    ]);
  });

  it("accepts partial collections for resume and requires all 63 for strict evidence", () => {
    const partial = buildVuePerformanceEvidence(
      { audit, records: [makeRecord()] },
      { requireBaselinePlatform: false, requireComplete: false },
    );
    expect(partial.rows).toHaveLength(1);
    expect(() =>
      validateVuePerformanceEvidence(partial, { requireBaselinePlatform: false }),
    ).toThrow("missing rows");
  });

  it("rejects duplicate and mixed collection identity", () => {
    const first = makeRecord();
    expect(() =>
      buildVuePerformanceEvidence(
        { audit, records: [first, first] },
        { requireBaselinePlatform: false, requireComplete: false },
      ),
    ).toThrow("Duplicate");
    for (const changed of [
      makeRecord({
        id: "dialog-open:zag-vue",
        environment: environment({ commit: "b".repeat(40) }),
      }),
      makeRecord({
        id: "dialog-open:zag-vue",
        environment: environment({ browserRevision: "changed" }),
      }),
      makeRecord({ id: "dialog-open:zag-vue", machine: { ...machine, logicalCoreCount: 4 } }),
    ]) {
      expect(() =>
        buildVuePerformanceEvidence(
          { audit, records: [first, changed] },
          { requireBaselinePlatform: false, requireComplete: false },
        ),
      ).toThrow(/mixed (revisions|environments|machines)/);
    }
  });

  it("requires current same-revision smoke eligibility", () => {
    const run = makeRun();
    const eligibility = createVuePerformanceEligibility({
      audit,
      environment: run.environment,
      machine,
      refreshedAt: "2026-08-23T00:00:00.000Z",
    });
    expect(assertVuePerformanceEligibilityForRun(eligibility, run)).toBe(run);
    expect(() =>
      assertVuePerformanceEligibilityForRun({ ...eligibility, revision: "b".repeat(40) }, run),
    ).toThrow("revision differs");
  });

  it("strictly checks all 63 row files against the existing manifest and report without writes", () => {
    const records = vuePerformanceProviderRows.map(({ id }, index) =>
      makeRecord({ id, samples: index === 0 ? [1, 1, 1, 1, 100] : undefined }),
    );
    const evidence = buildVuePerformanceEvidence(
      { audit, records },
      { requireBaselinePlatform: false },
    );
    const eligibility = createVuePerformanceEligibility({
      audit,
      environment: records[0].environment,
      machine,
      refreshedAt: "2026-08-23T00:00:00.000Z",
    });
    const rowFiles = records.map((_, index) => `${index}.json`);
    const files = new Map([
      ["/audit", "reviewed audit"],
      ["/eligibility", serializeVuePerformanceEvidence(eligibility)],
      ["/manifest", serializeVuePerformanceEvidence(evidence)],
      ["/report", "report"],
      ...records.map((record, index) => [
        `/rows/${rowFiles[index]}`,
        serializeVuePerformanceEvidence(record),
      ]),
    ]);
    const readFile = vi.fn((file) => files.get(file));
    const readDirectory = vi.fn(() => rowFiles);
    const renderMarkdown = vi.fn(() => "report");
    expect(
      checkVuePerformanceEvidence({
        auditPath: "/audit",
        eligibilityPath: "/eligibility",
        jsonPath: "/manifest",
        markdownPath: "/report",
        readDirectory,
        readFile,
        renderMarkdown,
        rowsPath: "/rows",
      }),
    ).toEqual(evidence);
    expect(readDirectory).toHaveBeenCalledOnce();
    expect(renderMarkdown).toHaveBeenCalledOnce();
    expect(evidence.rows[0].stability.stable).toBe(false);

    readDirectory.mockReturnValue(rowFiles.slice(1));
    expect(() =>
      checkVuePerformanceEvidence({
        auditPath: "/audit",
        eligibilityPath: "/eligibility",
        jsonPath: "/manifest",
        markdownPath: "/report",
        readDirectory,
        readFile,
        renderMarkdown,
        rowsPath: "/rows",
      }),
    ).toThrow("missing rows");
  });

  it("publishes a final row with its complete manifest and report in one transaction", () => {
    const records = vuePerformanceProviderRows.map(({ id }) => makeRecord({ id }));
    const evidence = buildVuePerformanceEvidence(
      { audit, records },
      { requireBaselinePlatform: false },
    );
    const writeArtifacts = vi.fn();
    publishVuePerformanceEvidence({
      evidence,
      jsonPath: "/manifest.json",
      markdown: "report\n",
      markdownPath: "/report.md",
      rowPath: "/rows/final.json",
      rowRecord: records.at(-1),
      writeArtifacts,
    });
    expect(writeArtifacts).toHaveBeenCalledOnce();
    expect(writeArtifacts.mock.calls[0][0]).toHaveLength(3);
  });
});

function makeRecord(overrides = {}) {
  return buildVuePerformanceRowRecord(
    { audit, run: makeRun(overrides) },
    { requireBaselinePlatform: false },
  );
}

function makeRun({
  environment: runEnvironment = environment(),
  flags: runFlags,
  id = "dialog-open:starwind-vue",
  lifecycle = {},
  machine: runMachine = machine,
  metric,
  samples = [10, 10.1, 9.9, 10.05, 9.95],
} = {}) {
  const plan = vuePerformanceProviderRows.find((row) => row.id === id);
  return createVuePerformanceRun({
    command: {
      arguments: ["--baseline", `--scenario=${plan.scenario}`, `--provider=${plan.provider}`],
      executable: "pnpm runtime:perf:vue",
    },
    completedAt: "2026-08-23T00:00:10.000Z",
    environment: runEnvironment,
    flags: runFlags ?? flags(id),
    machine: runMachine,
    rows: [
      {
        errors: [],
        id,
        lifecycle: {
          endpointVisible: true,
          overlayEmpty: true,
          passed: true,
          rootEmpty: true,
          ...lifecycle,
        },
        result: createRuntimePerformanceResult({
          metric: metric ?? plan.metric,
          provider: plan.provider,
          samples,
          scenario: plan.scenario,
        }),
      },
    ],
    startedAt: "2026-08-23T00:00:00.000Z",
  });
}

function flags(id, controlOverrides = {}) {
  const row = vuePerformanceProviderRows.find((candidate) => candidate.id === id);
  return {
    controls: {
      ...VUE_PERFORMANCE_BASELINE_CONTROLS,
      ...controlOverrides,
      rows: [{ cpuThrottle: row.cpuThrottle, id: row.id, warmupCount: 0, withinRunSampleCount: 5 }],
    },
    focused: true,
    mode: "baseline",
    providers: [row.provider],
    scenarios: [row.scenario],
    smoke: false,
  };
}

function environment(overrides = {}) {
  return {
    architecture: "x64",
    browserName: "chromium",
    browserRevision: "test-revision",
    browserVersion: "140.0",
    commit: "a".repeat(40),
    framework: "Vue 3.5.22",
    garbageCollectionAvailable: true,
    nodeVersion: "24.8.0",
    packageVersions: {
      ...zagVueExpectedResolvedVersions,
      ...rekaUiExpectedResolvedVersions,
      "@vitejs/plugin-vue": "6.0.8",
      "@starwind-ui/runtime": "0.0.0",
      "@starwind-ui/vue": "0.0.0",
      "@zag-js/core": zagVueExpectedResolvedVersions["@zag-js/core"],
      "@zag-js/vue": zagVueExpectedResolvedVersions["@zag-js/vue"],
      playwright: "1.62.0",
      "reka-ui": rekaUiExpectedResolvedVersions["reka-ui"],
      vite: "7.3.5",
      vue: "3.5.22",
    },
    platform: "linux",
    viewport: { deviceScaleFactor: 1, height: 900, width: 1280 },
    ...overrides,
  };
}
