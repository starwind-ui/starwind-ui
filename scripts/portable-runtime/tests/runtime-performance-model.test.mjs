import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createRuntimePerformanceEnvironment,
  createRuntimePerformanceResult,
  defineRuntimePerformanceScenarios,
  runtimePerformanceMeasurementTypes,
  scenarioRows,
  validateRuntimePerformanceEnvironment,
  validateRuntimePerformanceResult,
  writeStagedArtifacts,
} from "../runtime-performance/model.mjs";

describe("runtime performance model", () => {
  it("retains the existing immutable scenario identities and scales", () => {
    expect(Object.isFrozen(scenarioRows)).toBe(true);
    expect(scenarioRows).toHaveLength(23);
    expect(scenarioRows.map(({ key }) => key)).toEqual([
      "dialog-open",
      "select-open",
      "select-item-highlight",
      "menu-open",
      "tooltip-trigger-mount",
      "dialog-trigger-mount",
      "popover-trigger-mount",
      "preview-card-trigger-mount",
      "select-trigger-mount",
      "menu-item-highlight",
      "combobox-open",
      "combobox-trigger-mount",
      "combobox-item-highlight",
      "combobox-filter-input",
      "menu-submenu-open",
      "menu-submenu-item-highlight",
      "navigation-menu-content-switch",
      "tabs-high-count-mount",
      "tabs-activation-click",
      "accordion-high-count-mount",
      "accordion-toggle-click",
      "radio-group-high-count-mount",
      "radio-group-change-sweep",
    ]);
    expect(scenarioRows.find(({ key }) => key === "combobox-open")).toEqual({
      key: "combobox-open",
      category: "combobox-candidate",
      label: "Combobox open",
      cpuThrottle: 6,
      sampleCount: 5,
      type: "open",
      openTarget: "[data-benchmark-input]",
      openKey: "ArrowDown",
      details: "1000 items, ArrowDown-to-visible",
    });
    expect(runtimePerformanceMeasurementTypes).toContain("mount");
  });

  it("rejects duplicate, unknown, and incomplete scenario facts", () => {
    const scenario = scenarioRows[0];
    expect(() => defineRuntimePerformanceScenarios([scenario, scenario])).toThrow(/Duplicate/);
    expect(() =>
      defineRuntimePerformanceScenarios([{ ...scenario, frameworkComponent: "Dialog" }]),
    ).toThrow(/Unknown scenario field/);
    expect(() =>
      defineRuntimePerformanceScenarios([{ ...scenario, sampleCount: undefined }]),
    ).toThrow(/positive integer/);
  });

  it("rejects contradictory scenario sampling shapes", () => {
    const sampled = scenarioRows.find(({ type }) => type !== "mount");
    const mount = scenarioRows.find(({ type }) => type === "mount");

    expect(() =>
      defineRuntimePerformanceScenarios([{ ...sampled, groupCount: 5, iterationsPerGroup: 20 }]),
    ).toThrow(/Sampled scenarios must not define/);
    expect(() => defineRuntimePerformanceScenarios([{ ...mount, sampleCount: 5 }])).toThrow(
      /Mount scenarios must not define/,
    );
  });

  it("retains raw result samples and validates their summaries", () => {
    const result = createRuntimePerformanceResult({
      metric: "event-to-visible",
      provider: "starwind",
      samples: [3, 1, 2],
      scenario: "dialog-open",
    });

    expect(result).toEqual({
      metric: "event-to-visible",
      provider: "starwind",
      samples: [3, 1, 2],
      scenario: "dialog-open",
      medianMs: 2,
      p95Ms: null,
    });
    expect(validateRuntimePerformanceResult(result)).toBe(result);
    expect(() => validateRuntimePerformanceResult({ ...result, medianMs: 3 })).toThrow(
      /do not match raw samples/,
    );
  });

  it("normalizes and validates framework-runner environment facts", () => {
    const environment = createRuntimePerformanceEnvironment({
      architecture: "x64",
      browserName: "chromium",
      browserRevision: "1234567",
      browserVersion: "140.0.0",
      commit: "7358b6bf",
      framework: "vue",
      garbageCollectionAvailable: true,
      nodeVersion: "24.5.0",
      packageVersions: { vue: "3.5.18", "@zag-js/vue": "1.42.0" },
      platform: "linux",
      viewport: { deviceScaleFactor: 1, height: 900, width: 1280 },
    });

    expect(Object.keys(environment.packageVersions)).toEqual(["@zag-js/vue", "vue"]);
    expect(validateRuntimePerformanceEnvironment(environment)).toBe(environment);
    expect(() =>
      createRuntimePerformanceEnvironment({ ...environment, garbageCollectionAvailable: "yes" }),
    ).toThrow(/must be a boolean/);
  });

  it("keeps the shared model free of framework fixture syntax", () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, "../runtime-performance/model.mjs"),
      "utf8",
    );
    expect(source).not.toMatch(/<\w|createRoot|flushSync|Astro\.props|defineComponent|\.vue\b/);
  });

  it("rejects invalid artifact facts before staging", () => {
    const destination = path.resolve(import.meta.dirname, "artifact.md");
    expect(() => writeStagedArtifacts([])).toThrow(/nonempty array/);
    expect(() => writeStagedArtifacts([{ content: "valid", path: "relative.md" }])).toThrow(
      /must be absolute/,
    );
    expect(() => writeStagedArtifacts([{ content: {}, path: destination }])).toThrow(
      /string or Buffer/,
    );
    expect(() =>
      writeStagedArtifacts([
        { content: "first", path: destination },
        {
          content: "second",
          path: path.join(path.dirname(destination), "nested", "..", "artifact.md"),
        },
      ]),
    ).toThrow(/Duplicate runtime performance artifact path/);
  });
});
