import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  FOCUSED_REPORT_DIR,
  REPORT_PATH,
  buildRuntimePerformanceRunConfig,
  formatRuntimePerformanceList,
  formatRuntimePerformanceReport,
  libraryRows,
  scenarioRows,
} from "../measure-runtime-performance.mjs";

const generatedAt = new Date("2026-07-08T12:34:56.789Z");

describe("runtime performance measurement filters", () => {
  it("keeps the no-argument run on the full official report path", () => {
    const config = buildRuntimePerformanceRunConfig([], { generatedAt });

    expect(config.mode).toBe("run");
    expect(config.focusedRun).toBe(false);
    expect(config.reportPath).toBe(REPORT_PATH);
    expect(config.scenarios.map((scenario) => scenario.key)).toEqual(
      scenarioRows.map((scenario) => scenario.key),
    );
    expect(config.libraries.map((library) => library.key)).toEqual(
      libraryRows.map((library) => library.key),
    );
  });

  it("composes repeated scenario filters with a library filter into a scratch report", () => {
    const config = buildRuntimePerformanceRunConfig(
      [
        "--scenario",
        "select-trigger-mount",
        "--scenario=combobox-trigger-mount",
        "--library",
        "starwind",
      ],
      { generatedAt },
    );

    expect(config.focusedRun).toBe(true);
    expect(config.reportPath).not.toBe(REPORT_PATH);
    expect(config.reportPath.startsWith(FOCUSED_REPORT_DIR)).toBe(true);
    expect(path.basename(config.reportPath)).toBe(
      "2026-07-08T12-34-56-789Z-focused-runtime-performance-comparison.md",
    );
    expect(config.scenarios.map((scenario) => scenario.key)).toEqual([
      "select-trigger-mount",
      "combobox-trigger-mount",
    ]);
    expect(config.libraries.map((library) => library.key)).toEqual(["starwind"]);
  });

  it("includes Select highlighting as a cross-library hover scenario", () => {
    const config = buildRuntimePerformanceRunConfig(["--scenario", "select-item-highlight"], {
      generatedAt,
    });

    expect(config.scenarios).toEqual([
      expect.objectContaining({
        key: "select-item-highlight",
        sampleCount: 5,
        type: "hover",
      }),
    ]);
    expect(config.libraries.map((library) => library.key)).toEqual(["starwind", "base-ui", "zag"]);
  });

  it("narrows category filters before measuring libraries", () => {
    const config = buildRuntimePerformanceRunConfig(
      ["--category", "combobox-candidate", "--library", "base-ui"],
      { generatedAt },
    );

    expect(config.scenarios.map((scenario) => scenario.key)).toEqual([
      "combobox-open",
      "combobox-trigger-mount",
      "combobox-item-highlight",
      "combobox-filter-input",
    ]);
    expect(config.libraries.map((library) => library.key)).toEqual(["base-ui"]);
  });

  it("fails fast on unknown filter keys with valid alternatives", () => {
    expect(() =>
      buildRuntimePerformanceRunConfig(["--scenario", "missing-row"], { generatedAt }),
    ).toThrow(/Valid scenario keys: .*select-trigger-mount/);
    expect(() =>
      buildRuntimePerformanceRunConfig(["--category", "missing-category"], { generatedAt }),
    ).toThrow(/Valid category keys: .*combobox-candidate/);
    expect(() =>
      buildRuntimePerformanceRunConfig(["--library", "missing-library"], { generatedAt }),
    ).toThrow(/Valid library keys: .*starwind/);
  });

  it("lists valid scenario, category, and library keys", () => {
    const config = buildRuntimePerformanceRunConfig(["--list"], { generatedAt });
    const output = formatRuntimePerformanceList();

    expect(config).toEqual({ mode: "list" });
    expect(output).toContain("Scenarios:");
    expect(output).toContain("- select-item-highlight (baseline-hover) - Select item highlight");
    expect(output).toContain("- select-trigger-mount (baseline-mount) - Select trigger mount");
    expect(output).toContain("Categories:");
    expect(output).toContain("- combobox-candidate");
    expect(output).toContain("Libraries:");
    expect(output).toContain("- starwind - Starwind");
  });

  it("marks focused reports as local partial runs with raw sample data", () => {
    const scenario = scenarioRows.find((row) => row.key === "select-trigger-mount");
    const library = libraryRows.find((row) => row.key === "starwind");
    const markdown = formatRuntimePerformanceReport({
      dependencyRoot: "missing-performance-dependencies",
      filters: {
        categories: [],
        libraries: ["starwind"],
        scenarios: ["select-trigger-mount"],
      },
      focusedRun: true,
      generatedAt,
      libraries: [library],
      results: [
        {
          averageMs: 12.3,
          dispatchDurationSamples: [3.1, 3.5],
          eventDurationSamples: [4.5],
          forcedLayoutDurationSamples: [6.2, 6.8],
          groupAverages: [12.1, 12.5],
          library: library.key,
          libraryLabel: library.label,
          metric: "render-layout",
          samples: [10.1, 14.5],
          scenario: scenario.key,
          scenarioCategory: scenario.category,
          scenarioLabel: scenario.label,
        },
      ],
      scenarios: [scenario],
      versions: {
        baseUi: "1.6.0",
        react: "19.2.7",
        zagReact: "1.42.0",
      },
    }).join("\n");

    expect(markdown).toContain("# Focused Runtime Performance Comparison");
    expect(markdown).toContain("focused/local report");
    expect(markdown).toContain("- Scenario filters: select-trigger-mount");
    expect(markdown).toContain("- Library filters: starwind");
    expect(markdown).toContain(
      "pnpm runtime:perf -- --scenario select-trigger-mount --library starwind",
    );
    expect(markdown).toContain("Run the full official report with:");
    expect(markdown).toContain("temporary measurement project under the operating system's");
    expect(markdown).toContain("| Base UI | 1.6.0 | `@base-ui/react` |");
    expect(markdown).not.toMatch(/[A-Za-z]:[\\/](?:Users|tmp)[\\/]/i);
    expect(markdown).not.toContain(["starwind-ui", "runtime"].join("-"));
    expect(markdown).toContain("| Category | Scenario | Details | CPU | Metric | Starwind |");
    expect(markdown).toContain("| baseline-mount | Select trigger mount |");
    expect(markdown).toContain(
      "| baseline-mount | Select trigger mount | Starwind | 10.1, 14.5 | 12.1, 12.5 | 4.5 | 3.1, 3.5 | 6.2, 6.8 |",
    );
    expect(markdown).toContain("Dispatch samples");
    expect(markdown).toContain("Forced-layout samples");
  });
});
