import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  FOCUSED_REPORT_DIR,
  DIAGNOSTICS_REPORT_PATH,
  REPORT_PATH,
  buildRuntimePerformanceRunConfig,
  buildRuntimePerformanceReportPaths,
  formatRuntimePerformanceDiagnosticReport,
  formatRuntimePerformanceList,
  formatRuntimePerformancePublicReport,
  formatRuntimePerformanceReport,
  libraryRows,
  main,
  migrateExistingRuntimePerformanceReports,
  scenarioRows,
  writeStagedReports,
  writeRuntimePerformanceReportSet,
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

  it("makes snapshot and migration exclusive full-run modes", () => {
    expect(buildRuntimePerformanceRunConfig(["--snapshot"], { generatedAt })).toMatchObject({
      focusedRun: false,
      mode: "snapshot",
    });
    expect(
      buildRuntimePerformanceRunConfig(["--migrate-existing-reports"], { generatedAt }),
    ).toEqual({ mode: "migrate" });

    for (const args of [
      ["--snapshot", "--list"],
      ["--snapshot", "--scenario", "dialog-open"],
      ["--snapshot", "--library", "starwind"],
      ["--migrate-existing-reports", "--category", "baseline-open"],
      ["--migrate-existing-reports", "--snapshot"],
    ]) {
      expect(() => buildRuntimePerformanceRunConfig(args, { generatedAt })).toThrow(
        /cannot be combined|mutually exclusive/i,
      );
    }
  });

  it("uses one UTC day for canonical and snapshot report pairs", () => {
    expect(buildRuntimePerformanceReportPaths({ generatedAt, snapshot: false })).toEqual([
      REPORT_PATH,
      DIAGNOSTICS_REPORT_PATH,
    ]);
    expect(
      buildRuntimePerformanceReportPaths({
        generatedAt: new Date("2026-07-08T23:59:59.999-07:00"),
        snapshot: true,
      }).map((file) => path.basename(file)),
    ).toEqual([
      "runtime-performance-comparison.md",
      "runtime-performance-diagnostics.md",
      "runtime-performance-comparison-2026-07-09.md",
      "runtime-performance-diagnostics-2026-07-09.md",
    ]);
  });

  it("replaces the canonical and same-UTC-date snapshot quartet with one successful rerun", () => {
    const root = path.join(os.tmpdir(), `runtime-perf-snapshot-${process.pid}-${Date.now()}`);
    const scenario = scenarioRows[0];
    const library = libraryRows[0];
    const makeInput = (averageMs, sample, generatedAt) => ({
      generatedAt,
      libraries: [library],
      results: [
        {
          averageMs,
          library: library.key,
          libraryLabel: library.label,
          metric: "event-to-visible",
          samples: [sample],
          scenario: scenario.key,
          scenarioCategory: scenario.category,
          scenarioLabel: scenario.label,
        },
      ],
      scenarios: [scenario],
      versions: { baseUi: "1.6.0", react: "19.2.7", zagReact: "1.42.0" },
    });

    writeRuntimePerformanceReportSet({
      input: makeInput(11.1, 10.1, new Date("2026-07-09T00:15:00.000Z")),
      repoRoot: root,
      snapshot: true,
    });
    writeRuntimePerformanceReportSet({
      input: makeInput(22.2, 21.2, new Date("2026-07-09T23:45:00.000Z")),
      repoRoot: root,
      snapshot: true,
    });

    const reportPaths = buildRuntimePerformanceReportPaths({
      generatedAt: new Date("2026-07-09T00:15:00.000Z"),
      repoRoot: root,
      snapshot: true,
    });
    expect(reportPaths.map((file) => path.basename(file))).toEqual([
      "runtime-performance-comparison.md",
      "runtime-performance-diagnostics.md",
      "runtime-performance-comparison-2026-07-09.md",
      "runtime-performance-diagnostics-2026-07-09.md",
    ]);
    for (const reportPath of reportPaths) {
      const report = readFileSync(reportPath, "utf8");
      expect(report).toContain("Generated: 2026-07-09");
      expect(report).toContain("22.2 ms");
      expect(report).not.toContain("11.1 ms");
    }
    for (const reportPath of reportPaths.filter((file) => file.includes("diagnostics"))) {
      expect(readFileSync(reportPath, "utf8")).toContain("21.2");
    }
  });

  it("returns from migration mode before entering measurement prerequisites", async () => {
    let migrationCalls = 0;
    let measurementCalls = 0;

    await main(["--migrate-existing-reports"], {
      migrateReports() {
        migrationCalls += 1;
        return ["fixture-public.md", "fixture-diagnostic.md"];
      },
      runMeasurement() {
        measurementCalls += 1;
        throw new Error("dist/dependencies/fixture/server/browser path must not run");
      },
    });

    expect(migrationCalls).toBe(1);
    expect(measurementCalls).toBe(0);
  });

  it("defines the snapshot command in build, build, full-snapshot order", () => {
    const packageJson = JSON.parse(
      readFileSync(path.resolve(import.meta.dirname, "../../../package.json"), "utf8"),
    );

    expect(packageJson.scripts["runtime:perf:snapshot"]).toBe(
      "pnpm runtime:build && pnpm react:build && node scripts/portable-runtime/measure-runtime-performance.mjs --snapshot",
    );
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

  it("partitions one full result into matching public and diagnostic reports", () => {
    const scenario = scenarioRows[0];
    const library = libraryRows[0];
    const input = {
      generatedAt,
      libraries: [library],
      results: [
        {
          averageMs: 12.3,
          library: library.key,
          libraryLabel: library.label,
          metric: "event-to-visible",
          samples: [11.1, 13.5],
          scenario: scenario.key,
          scenarioCategory: scenario.category,
          scenarioLabel: scenario.label,
        },
      ],
      scenarios: [scenario],
      versions: { baseUi: "1.6.0", react: "19.2.7", zagReact: "1.42.0" },
    };
    const publicReport = formatRuntimePerformancePublicReport(input).join("\n");
    const diagnosticReport = formatRuntimePerformanceDiagnosticReport(input).join("\n");

    for (const shared of ["Generated: 2026-07-08", "| Base UI | 1.6.0 |", "12.3 ms"]) {
      expect(publicReport).toContain(shared);
      expect(diagnosticReport).toContain(shared);
    }
    expect(publicReport).not.toContain("Candidate Thresholds");
    expect(publicReport).not.toContain("Raw Samples");
    expect(diagnosticReport).toContain("Candidate Thresholds");
    expect(diagnosticReport).toContain("Raw Samples");
  });

  it("migrates legacy reports without dependencies and is deterministic", () => {
    const root = path.join(os.tmpdir(), `runtime-perf-migration-${process.pid}-${Date.now()}`);
    const docsDir = path.join(root, "docs/portable-runtime");
    mkdirSync(docsDir, { recursive: true });
    const legacy = `# Runtime Performance Comparison\n\nGenerated: 2026-07-11\n\n## Method\n\n- fixture method\n\n## Candidate Evaluation Thresholds\n\n- private threshold\n\n## Package Versions\n\n| Library   | Version | Source |\n| --- | ---: | --- |\n| Base UI | 1.6.0 | npm |\n\n## Results\n\n| Scenario   | Starwind |\n| --- | ---: |\n| Dialog | 12.3 ms |\n\n## Raw Samples\n\n| Scenario | Samples |\n| --- | ---: |\n| Dialog | 11.1, 13.5 |\n\n## Reading The Numbers\n\n- fixture reading\n`;
    for (const suffix of ["", "-2026-07-11", "-2026-07-13"]) {
      writeFileSync(path.join(docsDir, `runtime-performance-comparison${suffix}.md`), legacy);
    }

    const first = migrateExistingRuntimePerformanceReports({ repoRoot: root });
    const firstContents = first.map((file) => readFileSync(file, "utf8"));
    const second = migrateExistingRuntimePerformanceReports({ repoRoot: root });

    expect(second.map((file) => readFileSync(file, "utf8"))).toEqual(firstContents);
    expect(first).toHaveLength(6);
    expect(first.map((file) => path.basename(file))).not.toContain(
      `runtime-performance-comparison-${generatedAt.toISOString().slice(0, 10)}.md`,
    );
    const publicReport = readFileSync(
      path.join(docsDir, "runtime-performance-comparison.md"),
      "utf8",
    );
    const diagnostic = readFileSync(
      path.join(docsDir, "diagnostics/runtime-performance-diagnostics.md"),
      "utf8",
    );
    expect(publicReport).not.toContain("private threshold");
    expect(publicReport).not.toContain("11.1, 13.5");
    expect(diagnostic).toContain("Generated: 2026-07-11");
    expect(diagnostic).toMatch(/\| Dialog\s*\| 12\.3 ms\s*\|/);
    expect(diagnostic).toContain("11.1, 13.5");
  });

  it("does not replace any report when staging is incomplete", () => {
    const root = path.join(os.tmpdir(), `runtime-perf-stage-${process.pid}-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const first = path.join(root, "first.md");
    const second = path.join(root, "second.md");
    writeFileSync(first, "original first\n");
    writeFileSync(second, "original second\n");
    let writes = 0;

    expect(() =>
      writeStagedReports(
        [
          { content: "replacement first\n", path: first },
          { content: "replacement second\n", path: second },
        ],
        {
          writeFile(target, content) {
            writes += 1;
            if (writes === 2) throw new Error("fixture staging failure");
            writeFileSync(target, content);
          },
        },
      ),
    ).toThrow("fixture staging failure");
    expect(readFileSync(first, "utf8")).toBe("original first\n");
    expect(readFileSync(second, "utf8")).toBe("original second\n");
  });

  it("rolls back the whole report set when replacement is incomplete", () => {
    const root = path.join(os.tmpdir(), `runtime-perf-replace-${process.pid}-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const first = path.join(root, "first.md");
    const second = path.join(root, "second.md");
    writeFileSync(first, "original first\n");
    writeFileSync(second, "original second\n");

    expect(() =>
      writeStagedReports(
        [
          { content: "replacement first\n", path: first },
          { content: "replacement second\n", path: second },
        ],
        {
          rename(source, target) {
            if (source.includes(".staged-") && target === second) {
              throw new Error("fixture replacement failure");
            }
            renameSync(source, target);
          },
        },
      ),
    ).toThrow("fixture replacement failure");
    expect(readFileSync(first, "utf8")).toBe("original first\n");
    expect(readFileSync(second, "utf8")).toBe("original second\n");
  });
});
