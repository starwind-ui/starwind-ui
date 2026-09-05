import { describe, expect, it } from "vitest";

import { createRuntimePerformanceResult } from "../runtime-performance/model.mjs";
import { zagVueExpectedResolvedVersions } from "../package-size-vue-plan.mjs";
import {
  VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
  rekaUiExpectedResolvedVersions,
  vuePerformanceProviderRows,
} from "../runtime-performance/vue-plan.mjs";
import {
  buildVuePerformanceEvidence,
  buildVuePerformanceRowRecord,
  createVuePerformanceAudit,
  createVuePerformanceRun,
  VUE_PERFORMANCE_BASELINE_CONTROLS,
} from "../runtime-performance/vue-run-evidence.mjs";
import {
  renderVuePerformanceEvidenceMarkdown,
  renderVuePerformanceRunMarkdown,
} from "../runtime-performance/vue-report.mjs";

const audit = createVuePerformanceAudit({
  contents: "audit",
  source: VUE_PERFORMANCE_REKA_AUDIT_SOURCE,
});
const environment = {
  architecture: "x64",
  browserName: "chromium",
  browserRevision: "1234",
  browserVersion: "140.0",
  commit: "a".repeat(40),
  framework: "Vue 3.5.39",
  garbageCollectionAvailable: true,
  nodeVersion: "24.1.0",
  packageVersions: {
    ...zagVueExpectedResolvedVersions,
    ...rekaUiExpectedResolvedVersions,
    "@starwind-ui/runtime": "0.0.0",
    "@starwind-ui/vue": "0.0.0",
    "@vitejs/plugin-vue": "6.0.8",
    playwright: "1.62.0",
    vite: "7.3.5",
    vue: "3.5.39",
  },
  platform: "linux",
  viewport: { deviceScaleFactor: 1, height: 900, width: 1280 },
};
const machine = { cpuModel: "Test CPU", logicalCoreCount: 8 };

describe("private Vue performance reports", () => {
  it("renders collection provenance, five raw samples, controls, and no p95", () => {
    const evidence = makeEvidence();
    const markdown = renderVuePerformanceEvidenceMarkdown(evidence, {
      requireBaselinePlatform: false,
    });
    expect(renderVuePerformanceEvidenceMarkdown(evidence, { requireBaselinePlatform: false })).toBe(
      markdown,
    );
    expect(markdown).toContain("Private order-14 evidence");
    expect(markdown).toContain("Comparator results are advisory");
    expect(markdown).toContain("CPU: Test CPU (8 logical cores)");
    expect(markdown).toContain("Warmups per row: 0");
    expect(markdown).toContain("Measured samples per row: 5");
    expect(markdown).toContain(
      "one loaded context, page, CDP session, and navigation for five in-page cycles",
    );
    expect(markdown).toContain("10.000 ms, 11.000 ms, 12.000 ms, 13.000 ms, 14.000 ms");
    expect(markdown).toContain("`@vitejs/plugin-vue@6.0.8`");
    expect(markdown).toContain("`playwright@1.62.0`");
    expect(markdown).toContain("`vite@7.3.5`");
    expect(markdown).toContain("| no |");
    expect(markdown).toContain("unstable, no ceiling");
    expect(markdown).toContain(
      "Within-row stability limits were exceeded, so no candidate ceiling was calculated.",
    );
    expect(markdown).not.toMatch(/p95|ranking|winner|faster than/i);
  });

  it("starts with a readable provider comparison and explains scenario scale", () => {
    const markdown = renderVuePerformanceEvidenceMarkdown(makeEvidence(), {
      requireBaselinePlatform: false,
    });

    expect(markdown.indexOf("## Method")).toBeLessThan(
      markdown.indexOf("### Collection provenance"),
    );
    expect(markdown.indexOf("## Comparison results")).toBeLessThan(
      markdown.indexOf("## Detailed evidence"),
    );
    expect(markdown).toContain(
      "| Select item highlight | Sequential pointermove sweep across 1,000 mounted items | 1x | `pointermove-sweep` | 12.000 ms stable | 12.000 ms stable | excluded |",
    );
    expect(markdown).toContain(
      "Highlight results measure a complete sequential sweep across 1,000 items, not one item transition.",
    );
    expect(markdown).toContain("Radio Group change sweep covers 100 checked-state changes.");
  });

  it("lists comparator exclusions and keeps raw evidence below the summary", () => {
    const markdown = renderVuePerformanceEvidenceMarkdown(makeEvidence(), {
      requireBaselinePlatform: false,
    });

    expect(markdown).toContain("## Excluded Reka comparisons");
    expect(markdown).toContain(
      "| Select item highlight | Exact Reka UI 2.10.3 cannot complete the common synthetic pointermove action without changing the measured behavior. |",
    );
    expect(markdown).toContain(
      "| Select trigger mount | Exact Reka UI 2.10.3 exceeds the fixed lifecycle limit at the approved 1,000-root scale. |",
    );
    expect(markdown.indexOf("## Detailed evidence")).toBeLessThan(
      markdown.indexOf("### Raw samples and stability"),
    );
    expect(markdown).toContain(
      "| `dialog-open:starwind-vue` | 1.000 ms, 1.000 ms, 1.000 ms, 1.000 ms, 100.000 ms |",
    );
  });

  it("uses an empty reason for available ceilings", () => {
    const markdown = renderVuePerformanceEvidenceMarkdown(makeEvidence(), {
      requireBaselinePlatform: false,
    });

    expect(markdown).toContain(
      "| `select-open:starwind-vue` | ceiling available |  | 14.000 ms | 1.000 ms |",
    );
    expect(markdown).not.toContain("| ceiling available | unavailable |");
  });

  it("labels focused run output as diagnostic with zero warmups and five samples", () => {
    const record = makeEvidence().rows[0];
    const markdown = renderVuePerformanceRunMarkdown({
      environment,
      flags: record.flags,
      focused: true,
      rows: [{ ...record, lifecycle: record.lifecycle }],
    });
    expect(markdown).toContain("Private Focused Vue Runtime Performance Run");
    expect(markdown).toContain("Diagnostic output only");
    expect(markdown).toContain("Warmups: 0");
    expect(markdown).toContain("Measured samples: 5");
  });
});

function makeEvidence() {
  const records = vuePerformanceProviderRows.map((row, index) => {
    const flags = {
      controls: {
        ...VUE_PERFORMANCE_BASELINE_CONTROLS,
        rows: [
          { cpuThrottle: row.cpuThrottle, id: row.id, warmupCount: 0, withinRunSampleCount: 5 },
        ],
      },
      focused: true,
      mode: "baseline",
      providers: [row.provider],
      scenarios: [row.scenario],
      smoke: false,
    };
    const run = createVuePerformanceRun({
      command: {
        arguments: ["--baseline", `--scenario=${row.scenario}`, `--provider=${row.provider}`],
        executable: "pnpm runtime:perf:vue",
      },
      completedAt: "2026-08-23T00:00:10.000Z",
      environment,
      flags,
      machine,
      rows: [
        {
          errors: [],
          id: row.id,
          lifecycle: { endpointVisible: true, overlayEmpty: true, passed: true, rootEmpty: true },
          result: createRuntimePerformanceResult({
            metric: row.metric,
            provider: row.provider,
            samples: index === 0 ? [1, 1, 1, 1, 100] : [10, 11, 12, 13, 14],
            scenario: row.scenario,
          }),
        },
      ],
      startedAt: "2026-08-23T00:00:00.000Z",
    });
    return buildVuePerformanceRowRecord({ audit, run }, { requireBaselinePlatform: false });
  });
  return buildVuePerformanceEvidence({ audit, records }, { requireBaselinePlatform: false });
}
