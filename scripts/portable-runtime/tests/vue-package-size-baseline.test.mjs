import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  vuePackageSizeBaseline,
  validateVuePackageSizeBaselineEvidence,
} from "../vue-package-size-baseline.mjs";
import { buildVueBaselineEvidence } from "../package-size-vue-baseline-runner.mjs";

const evidencePath = new URL(
  "../../../.scratch/vue-package-size-comparison/evidence/vue-package-size-baseline.json",
  import.meta.url,
);

describe("adopted Vue package-size baseline", () => {
  it("matches every adopted value and sentinel from the committed evidence", () => {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

    expect(validateVuePackageSizeBaselineEvidence(evidence)).toBe(true);
    expect(vuePackageSizeBaseline).toMatchObject({
      evidenceSource:
        ".scratch/vue-package-size-comparison/evidence/vue-package-size-baseline.json",
      provenance: {
        command: {
          arguments: ["scripts/portable-runtime/measure-package-sizes.mjs", "--baseline-vue"],
          executable: "node",
        },
        commit: "ef58435373775514c1237ce94bfc3e7628c1ebe4",
        environment: {
          architecture: "x64",
          nodeVersion: "24.19.0",
          platform: "linux",
        },
      },
      sentinels: ["select", "combobox", "context-menu", "menu", "navigation-menu"],
      budgets: {
        "vue.adapter-only": { ceilingBytes: 54_398, maximumBytes: 51_807 },
        "vue.cold.combobox": { ceilingBytes: 30_721, maximumBytes: 29_258 },
        "vue.cold.context-menu": { ceilingBytes: 28_564, maximumBytes: 27_203 },
        "vue.cold.menu": { ceilingBytes: 28_544, maximumBytes: 27_184 },
        "vue.cold.navigation-menu": { ceilingBytes: 26_122, maximumBytes: 24_878 },
        "vue.cold.select": { ceilingBytes: 31_613, maximumBytes: 30_107 },
        "vue.combined": { ceilingBytes: 211_271, maximumBytes: 201_210 },
        "vue.packed-tarball": { ceilingBytes: 142_288, maximumBytes: 135_512 },
      },
      comparatorSnapshots: {
        starwindMatchedGzipBytes: 176_194,
        zagMatchedGzipBytes: 128_292,
        zagVersion: "1.42.0",
      },
    });
    expect(Object.isFrozen(vuePackageSizeBaseline)).toBe(true);
    expect(Object.isFrozen(vuePackageSizeBaseline.budgets)).toBe(true);
    for (const budget of Object.values(vuePackageSizeBaseline.budgets)) {
      expect(budget.values).toEqual([
        budget.maximumBytes,
        budget.maximumBytes,
        budget.maximumBytes,
      ]);
      expect(budget.headroomBytes).toBe(Math.max(Math.ceil(budget.maximumBytes * 0.05), 1_024));
      expect(budget.ceilingBytes).toBe(budget.maximumBytes + budget.headroomBytes);
    }
  });

  it("rejects evidence drift and a changed sentinel selection", () => {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    const changedCeiling = structuredClone(evidence);
    changedCeiling.candidates[0].ceilingBytes += 1;
    expect(() => validateVuePackageSizeBaselineEvidence(changedCeiling)).toThrow(
      "candidate vue.adapter-only differs from the adopted baseline",
    );

    const changedSentinel = structuredClone(evidence);
    changedSentinel.sentinels[0].component = "tooltip";
    expect(() => validateVuePackageSizeBaselineEvidence(changedSentinel)).toThrow(
      "sentinels differ from the adopted baseline",
    );

    const changedRawValue = structuredClone(evidence);
    changedRawValue.runs[2].rows.find(({ id }) => id === "vue.combined").gzipBytes += 1;
    expect(() => validateVuePackageSizeBaselineEvidence(changedRawValue)).toThrow(
      "raw row vue.combined differs in run 3",
    );

    const changedProvenance = structuredClone(evidence);
    changedProvenance.runs[0].environment.nodeVersion = "24.19.1";
    expect(() => validateVuePackageSizeBaselineEvidence(changedProvenance)).toThrow(
      "run 1 provenance differs",
    );
  });

  it("rejects a different capture command after generic evidence is rebuilt consistently", () => {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    const changedRuns = evidence.runs.map((run) => ({
      ...run,
      command: {
        ...run.command,
        arguments: [...run.command.arguments, "--unexpected-capture-path"],
      },
    }));
    const internallyValidEvidence = buildVueBaselineEvidence(changedRuns);

    expect(internallyValidEvidence.stability.stable).toBe(true);
    expect(() => validateVuePackageSizeBaselineEvidence(internallyValidEvidence)).toThrow(
      "run 1 command differs",
    );
  });
});
