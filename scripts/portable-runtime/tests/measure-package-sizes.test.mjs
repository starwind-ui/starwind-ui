import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  addSourceContributionContexts,
  buildContractGenerationProofMeasurementRows,
  committedComparatorBaselines,
  createMeasurementProvenance,
  createStarwindVueAlias,
  evaluateColorPickerSizeComparison,
  formatColorPickerSizeComparisonMarkdown,
  formatPackageSizeReports,
  getPackageSizeCommandMode,
  getPackageSizeMeasurementPlan,
  measureBundle,
  resolveStarwindVueBuiltPath,
  summarizeDynamicBundleOutput,
  validateInstalledZagVueComparator,
  withVueSourceContribution,
  writePackageSizeReports,
} from "../measure-package-sizes.mjs";
import {
  STARWIND_VUE_MEASUREMENT_LABELS,
  starwindVueRuntimeComponents,
  starwindZagVueOverlapMappings,
  zagVueComparatorPackages,
} from "../package-size-vue-plan.mjs";
import { buildSourceContributionAnalyses } from "../source-contribution-report.mjs";

describe("package-size command prerequisites", () => {
  it("builds Vue and includes its evidence in the prepared public check", () => {
    const rootPackage = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    );

    expect(rootPackage.scripts["runtime:size"]).toBe(
      "pnpm runtime:build && pnpm react:build && pnpm vue:build && node scripts/portable-runtime/measure-package-sizes.mjs",
    );
    expect(rootPackage.scripts["runtime:size:check"]).toBe(
      "pnpm runtime:build && pnpm react:build && pnpm vue:build && node scripts/portable-runtime/measure-package-sizes.mjs --check --private-vue",
    );
    expect(rootPackage.scripts["runtime:size:check:prepared"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --check --private-vue",
    );
    expect(rootPackage.scripts["runtime:size:check:prepared:private"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --check --private-vue",
    );
    expect(rootPackage.scripts["runtime:size:baseline:vue"]).toBe(
      "node scripts/portable-runtime/measure-package-sizes.mjs --baseline-vue",
    );
    expect(rootPackage.scripts["release:gate"]).toContain("pnpm runtime:size:check:prepared");
    expect(rootPackage.scripts["release:gate"]).not.toContain(
      "pnpm runtime:size:check:prepared:private",
    );
  });

  it("routes offline evidence checks before baseline capture and normal measurement", () => {
    expect(getPackageSizeCommandMode(["--baseline-vue", "--check-evidence"])).toBe(
      "check-vue-evidence",
    );
    expect(getPackageSizeCommandMode(["--baseline-vue"])).toBe("capture-vue-baseline");
    expect(getPackageSizeCommandMode(["--check", "--private-vue"])).toBe("measure");
  });
});

describe("Vue public-beta browser measurement plan", () => {
  it("uses built root and subpath aliases", () => {
    const root = "/repo";
    expect(resolveStarwindVueBuiltPath("@starwind-ui/vue", { repoRoot: root })).toBe(
      path.join(root, "packages/vue/dist/index.js"),
    );
    expect(resolveStarwindVueBuiltPath("@starwind-ui/vue/select", { repoRoot: root })).toBe(
      path.join(root, "packages/vue/dist/select/index.js"),
    );
    expect(createStarwindVueAlias({ repoRoot: root }).name).toBe("starwind-vue-alias");
  });

  it("fails a required alias when built Vue output is missing", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "missing-built-vue-test-"));
    const resolvers = [];
    createStarwindVueAlias({ repoRoot: root }).setup({
      onResolve(options, callback) {
        resolvers.push({ callback, filter: options.filter });
      },
    });

    expect(() =>
      resolvers.find(({ filter }) => filter.test("@starwind-ui/vue")).callback(),
    ).toThrow("Required built Vue package output is missing");
    rmSync(root, { force: true, recursive: true });
  });

  it("keeps public checks unchanged and adds complete offline private checks", () => {
    const publicCheck = getPackageSizeMeasurementPlan({ checkOnly: true });
    const privateCheck = getPackageSizeMeasurementPlan({
      checkOnly: true,
      includePrivateVue: true,
    });
    const refresh = getPackageSizeMeasurementPlan();

    expect(publicCheck.privateVueBundleRows).toEqual([]);
    expect(publicCheck.privateVueMatchedBaselines).toEqual([]);
    expect(privateCheck.installComparators).toBe(false);
    expect(privateCheck.privateVueBundleRows.map(({ label }) => label)).toEqual([
      STARWIND_VUE_MEASUREMENT_LABELS.adapterOnly,
      STARWIND_VUE_MEASUREMENT_LABELS.combined,
      STARWIND_VUE_MEASUREMENT_LABELS.completeCatalog,
    ]);
    expect(privateCheck.privateVueColdImportRows).toHaveLength(37);
    expect(privateCheck.privateVueMatchedRows.map(({ provider }) => provider)).toEqual([
      "starwind-vue",
    ]);
    expect(privateCheck.privateVueMatchedBaselines).toEqual([
      {
        componentCount: 30,
        gzipBytes: 128_292,
        minifiedBytes: null,
        provider: "zag-vue",
        version: "1.42.0",
      },
    ]);
    expect(refresh.privateVueColdImportRows.map(({ component }) => component)).toEqual([
      ...starwindVueRuntimeComponents,
      "theme",
    ]);
    expect(refresh.privateVueMatchedRows.map(({ provider }) => provider)).toEqual([
      "starwind-vue",
      "zag-vue",
    ]);
    expect(refresh.privateVueMatchedRows.at(-1).comparatorInstall).toBe("zag-vue-exact");
  });

  it("externalizes Vue in every Starwind row and Runtime only in adapter-only", () => {
    const plan = getPackageSizeMeasurementPlan();
    const starwindRows = [
      ...plan.privateVueBundleRows,
      ...plan.privateVueColdImportRows,
      ...plan.privateVueMatchedRows.filter(({ provider }) => provider === "starwind-vue"),
    ];
    for (const row of starwindRows) expect(row.external).toContain("vue");
    expect(plan.privateVueBundleRows[0].external).toContain("@starwind-ui/runtime/*");
    expect(plan.privateVueBundleRows[1].external).not.toContain("@starwind-ui/runtime/*");
  });

  it("requests and retains source metafiles for both Vue headlines", async () => {
    const plan = getPackageSizeMeasurementPlan();
    const buildOptions = [];
    const results = await Promise.all(
      plan.privateVueBundleRows.slice(0, 2).map((row) =>
        measureBundle(row, undefined, {
          build: async (options) => {
            buildOptions.push(options);
            return {
              metafile: {
                outputs: {
                  "entry.js": {
                    inputs: {
                      "/repo/packages/vue/dist/index.js": { bytesInOutput: 275 },
                    },
                  },
                },
              },
              outputFiles: [outputFile(path.join(options.outdir, "entry.js"), "export {};")],
            };
          },
        }),
      ),
    );

    expect(buildOptions.map(({ metafile }) => metafile)).toEqual([true, true]);
    expect(results.map(({ sourceContribution }) => sourceContribution)).toEqual([
      { label: "@starwind-ui/vue (adapter only) source attribution" },
      { label: "@starwind-ui/vue + runtime source attribution" },
    ]);
    expect(results.map(({ metafile }) => metafile)).toEqual([
      {
        outputs: {
          "entry.js": {
            inputs: { "/repo/packages/vue/dist/index.js": { bytesInOutput: 275 } },
          },
        },
      },
      {
        outputs: {
          "entry.js": {
            inputs: { "/repo/packages/vue/dist/index.js": { bytesInOutput: 275 } },
          },
        },
      },
    ]);

    const [analysis] = buildSourceContributionAnalyses({
      readFile: () => "// src/index.ts\nexport {};",
      repoRoot: "/repo",
      results: [results[0]],
      tmpRoot: "/tmp/starwind-package-size-comparison",
    });

    expect(analysis.categories).toEqual([{ bytes: 275, label: "Vue adapter" }]);
    expect(withVueSourceContribution({ label: "public row" })).toEqual({ label: "public row" });
  });

  it("builds Vue matched-support context from all 30 authoritative cold imports", () => {
    const plan = getPackageSizeMeasurementPlan();
    const matchedRow = withVueSourceContribution(
      plan.privateVueMatchedRows.find(({ provider }) => provider === "starwind-vue"),
    );
    const coldImportRows = starwindZagVueOverlapMappings.map(({ starwind }, index) => ({
      component: starwind,
      gzipBytes: index + 1,
      provider: "starwind-vue",
    }));
    const results = addSourceContributionContexts([
      ...coldImportRows,
      { ...matchedRow, gzipBytes: 100 },
    ]);

    expect(results.at(-1).sourceContribution.context).toEqual({
      combinedGzipBytes: 100,
      componentCount: 30,
      interpretation:
        "Use both columns: lower combined size is good, but higher savings can also come from higher isolated imports.",
      isolatedGzipBytes: 465,
      sharedSavingsGzipBytes: 365,
    });
  });

  it("retains dynamic outputs separately from the static headline graph", () => {
    const summary = summarizeDynamicBundleOutput({
      initialOutputPaths: ["/tmp/out/entry.js", "/tmp/out/static.js"],
      outputFiles: [
        outputFile("/tmp/out/static.js", "export const staticValue = 1;"),
        outputFile("/tmp/out/dynamic-b.js", "export const b = 2;"),
        outputFile("/tmp/out/entry.js", 'import "./static.js"; import("./dynamic-b.js");'),
        outputFile("/tmp/out/dynamic-a.js", "export const a = 1;"),
      ],
    });

    expect(summary.paths).toEqual(["dynamic-a.js", "dynamic-b.js"]);
    expect(summary.minifiedBytes).toBe(
      Buffer.byteLength("export const a = 1;") + Buffer.byteLength("export const b = 2;"),
    );
    expect(summary.gzipBytes).toBeGreaterThan(0);
  });

  it("captures the complete private Vue provenance model", () => {
    const provenance = createMeasurementProvenance({
      command: { arguments: ["measure-package-sizes.mjs", "--private-vue"], executable: "/node" },
      commit: "a".repeat(40),
      comparatorPackages: { "@zag-js/vue": "1.42.0" },
      environment: completeEnvironmentFixture(),
      flags: { gzipLevel: 9, staticGraphHeadlines: true },
      packageVersions: { "@starwind-ui/vue": "0.0.0" },
    });

    expect(provenance).toEqual({
      command: {
        arguments: ["measure-package-sizes.mjs", "--private-vue"],
        executable: "/node",
      },
      commit: "a".repeat(40),
      comparator: {
        name: "zag-vue",
        packages: { "@zag-js/vue": "1.42.0" },
        version: "1.42.0",
      },
      environment: completeEnvironmentFixture(),
      flags: { gzipLevel: 9, staticGraphHeadlines: true },
      packageVersions: { "@starwind-ui/vue": "0.0.0" },
    });
    expect(Object.isFrozen(provenance)).toBe(true);
    expect(Object.isFrozen(provenance.command.arguments)).toBe(true);
  });

  it("rejects an installed comparator package with the wrong exact version", () => {
    const installRoot = mkdtempSync(path.join(os.tmpdir(), "zag-vue-comparator-test-"));
    try {
      for (const packageName of zagVueComparatorPackages) {
        const packageDirectory = path.join(installRoot, "node_modules", packageName);
        mkdirSync(packageDirectory, { recursive: true });
        writeFileSync(
          path.join(packageDirectory, "package.json"),
          JSON.stringify({
            name: packageName,
            version: packageName === "@zag-js/vue" ? "1.43.0" : "1.42.0",
          }),
        );
      }
      expect(() => validateInstalledZagVueComparator(installRoot)).toThrow(
        "@zag-js/vue: expected 1.42.0, received 1.43.0",
      );
    } finally {
      rmSync(installRoot, { force: true, recursive: true });
    }
  });
});

describe("contract-generation proof measurement rows", () => {
  it("projects every exact shipping row without exposing release budgets", () => {
    const rows = buildContractGenerationProofMeasurementRows({
      bundleResults: [
        measurement("@starwind-ui/runtime", 100, 10),
        measurement("@starwind-ui/react + runtime", 200, 20),
      ],
      sourcePayloadResults: [
        payload("@starwind-ui/astro", 301, 31, 3_001, 30_001),
        payload("@starwind-ui/react", 302, 32, 3_002, 30_002),
        payload("@starwind-ui/runtime", 303, 33, 3_003, 30_003),
      ],
      supportResults: [
        supportMeasurement("all-three-overlap", 400, 40),
        supportMeasurement("starwind-zag-overlap", 500, 50),
        componentMeasurement("button", 601, 61),
        componentMeasurement("checkbox", 602, 62),
        componentMeasurement("select", 603, 63),
      ],
    });

    expect(Object.keys(rows)).toEqual([
      "runtimeHeadline",
      "reactWithRuntime",
      "allThreeOverlap",
      "starwindZagOverlap",
      "isolatedButton",
      "isolatedCheckbox",
      "isolatedSelect",
      "packagePayloads",
    ]);
    expect(rows.isolatedCheckbox).toEqual({ gzipBytes: 62, minifiedBytes: 602 });
    expect(rows.packagePayloads).toEqual({
      astro: {
        minifiedBytes: 301,
        packageGzipBytes: 3_001,
        packageUnpackedBytes: 30_001,
        sourceGzipBytes: 31,
      },
      react: {
        minifiedBytes: 302,
        packageGzipBytes: 3_002,
        packageUnpackedBytes: 30_002,
        sourceGzipBytes: 32,
      },
      runtime: {
        minifiedBytes: 303,
        packageGzipBytes: 3_003,
        packageUnpackedBytes: 30_003,
        sourceGzipBytes: 33,
      },
    });
  });

  it("rejects missing and nonnumeric proof measurements", () => {
    const input = completeProofMeasurementFixture();
    input.supportResults = input.supportResults.filter(({ component }) => component !== "button");
    expect(() => buildContractGenerationProofMeasurementRows(input)).toThrow(
      "Missing required shipping measurement: isolatedButton",
    );

    const nonnumeric = completeProofMeasurementFixture();
    nonnumeric.bundleResults[0].gzipBytes = null;
    expect(() => buildContractGenerationProofMeasurementRows(nonnumeric)).toThrow(
      "Nonnumeric shipping measurement: runtimeHeadline.gzipBytes",
    );
  });
});

describe("package-size public and diagnostic reports", () => {
  it("keeps release checks local and reserves comparator installs for explicit refreshes", () => {
    const check = getPackageSizeMeasurementPlan({ checkOnly: true });
    const refresh = getPackageSizeMeasurementPlan();

    expect(check.installComparators).toBe(false);
    expect(check.bundleRows.map(({ label }) => label)).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/runtime/color-picker",
      "@starwind-ui/react (adapter only)",
      "@starwind-ui/react + runtime",
    ]);
    expect(check.supportRows.every(({ provider }) => provider === "starwind")).toBe(true);
    expect(check.bundleBaselines).toBe(committedComparatorBaselines.bundleResults);
    expect(check.supportBaselines).toBe(committedComparatorBaselines.supportResults);

    expect(refresh.installComparators).toBe(true);
    expect(refresh.bundleRows.length).toBeGreaterThan(check.bundleRows.length);
    expect(refresh.supportRows.length).toBeGreaterThan(check.supportRows.length);
    expect(refresh.bundleBaselines).toEqual([]);
    expect(refresh.supportBaselines).toEqual([]);
  });

  it("renders one fixture result into matching reports with private sections only in diagnostics", () => {
    const reports = formatPackageSizeReports(reportFixture());
    const publicHeadings = [...reports.publicReport.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1],
    );
    const diagnosticHeadings = [...reports.diagnosticReport.matchAll(/^(#{2,3}) (.+)$/gm)].map(
      (match) => match[2],
    );
    const privateHeadings = [
      "Budget Checks",
      "Private Vue Measurement Method",
      "Private Vue Accepted Baseline Provenance",
      "Private Vue Accepted Raw Runs",
      "Private Vue Accepted Cold-Import Sentinels",
      "Private Vue Adopted Budgets",
      "Private Vue Headlines",
      "Private Vue Cold Imports",
      "Private Vue Combined Catalog",
      "Private Vue Matched Zag Support",
      "Private Vue Package Payload",
      "Private Vue Styled Copied-Source Payload",
      "Private Vue Provenance",
      "Private Vue Dynamic Chunks",
      "Private Vue Measurement Limitations",
      "Raw Gzip Diagnostics",
      "Starwind Source Contribution Analysis",
      "Bundle Entry Sizes",
    ];

    expect(publicHeadings).toEqual([
      "Method",
      "At A Glance",
      "Starwind-Matched Support",
      "Isolated vs Combined Support Costs",
      "Starwind Component Matches",
      "Starwind Published Source Payloads",
      "Reading The Numbers",
    ]);
    expect(
      [
        "Budget Checks",
        "Color Picker Rebaseline Evidence",
        "Headline Aggregate Regression Guards",
        "Targeted Cold-Import Budgets",
        "Matched-Support Aggregate Regression Guards",
        "Standalone Color Picker Comparison",
        "Private Vue Accepted Baseline Provenance",
        "Private Vue Accepted Raw Runs",
        "Private Vue Accepted Cold-Import Sentinels",
        "Private Vue Adopted Budgets",
        "Private Vue Measurement Method",
      ].map((heading) => diagnosticHeadings.indexOf(heading)),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(reports.publicReport).toContain("Generated: 2030-05-06");
    expect(reports.diagnosticReport).toContain("Generated: 2030-05-06");
    expect(reports.publicReport).toContain("| 1 | `@starwind-ui/runtime` | 2.0 KiB | 4.0 KiB |");
    expect(reports.diagnosticReport).toContain(
      "| 1 | `@starwind-ui/runtime` | 2.0 KiB | 4.0 KiB |",
    );

    for (const heading of privateHeadings) {
      expect(reports.publicReport).not.toContain(`## ${heading}`);
      expect(reports.diagnosticReport.match(new RegExp(`^## ${heading}$`, "gm"))).toHaveLength(1);
    }
    expect(reports.publicReport).not.toContain("### Color Picker Rebaseline Evidence");
    expect(reports.diagnosticReport).toContain("### Color Picker Rebaseline Evidence");
    expect(reports.publicReport).not.toContain("Source-contribution rows use esbuild metafile");
    expect(reports.diagnosticReport).toContain("Source-contribution rows use esbuild metafile");
    expect(reports.publicReport).not.toContain("@starwind-ui/vue");
    expect(reports.publicReport).not.toContain("Private Vue");
    expect(reports.publicReport).not.toContain("vue.adapter-only");
    expect(reports.diagnosticReport).toContain(
      "scripts/portable-runtime/evidence/vue-package-size-baseline.json",
    );
    expect(reports.diagnosticReport).toContain(
      "| `vue.adapter-only` | 51,807 B | 51,807 B | 51,807 B | 51,807 B | 2,591 B | 54,398 B | Pass |",
    );
    expect(reports.diagnosticReport).toContain(
      "| Zag Vue 1.42.0 matched support | 128,292 B | Advisory snapshot |",
    );
    expect(reports.diagnosticReport).toContain(
      "The accepted sentinels are the five Runtime-backed cold imports with the largest stable maximum. Ties are broken by component id. Theme is excluded.",
    );
    expect(
      reports.diagnosticReport
        .match(
          /## Private Vue Accepted Cold-Import Sentinels\n\n[\s\S]+?\n\n## Private Vue Adopted Budgets/,
        )?.[0]
        .match(/^\| \d \| ([^|]+) \|/gm)
        ?.map((row) => row.match(/^\| \d \| ([^|]+) \|/)?.[1].trim()),
    ).toEqual(["select", "combobox", "context-menu", "menu", "navigation-menu"]);
    expect(reports.diagnosticReport).toContain("| 54 | 1.0 KiB |");
    expect(reports.diagnosticReport).toContain(
      "| @starwind-ui/vue complete catalog | `chunks/vue-dynamic.js` | 21 B |",
    );
    expect(reports.diagnosticReport).toContain(`Commit: \`${"a".repeat(40)}\`.`);
    expect(reports.diagnosticReport).toContain(
      'Command: `"node" "measure-package-sizes.mjs" "--private-vue"`.',
    );
    expect(reports.diagnosticReport).toContain(
      "Environment: Linux 6.8, kernel 6.8.1, linux x64, Node 24.0.0, npm 10.0.0, pnpm 10.0.0, esbuild 0.25.0, zlib 1.3.1.",
    );
  });

  it("writes both reports normally and leaves both byte-unchanged in failed-budget check mode", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "starwind-size-report-test-"));
    const publicPath = path.join(root, "package-size-comparison.md");
    const diagnosticPath = path.join(root, "diagnostics", "package-size-diagnostics.md");

    try {
      expect(writePackageSizeReports(reportFixture(), { diagnosticPath, publicPath })).toBe(true);
      const publicReport = readFileSync(publicPath, "utf8");
      const diagnosticReport = readFileSync(diagnosticPath, "utf8");
      writeFileSync(publicPath, "seeded public\n");
      writeFileSync(diagnosticPath, "seeded diagnostic\n");

      expect(
        writePackageSizeReports(
          {
            ...reportFixture(),
            packageBudgetResults: {
              ...reportFixture().packageBudgetResults,
              failures: ["fixture budget failure"],
            },
          },
          { checkOnly: true, diagnosticPath, publicPath },
        ),
      ).toBe(false);
      expect(readFileSync(publicPath, "utf8")).toBe("seeded public\n");
      expect(readFileSync(diagnosticPath, "utf8")).toBe("seeded diagnostic\n");

      expect(
        writePackageSizeReports(
          {
            ...reportFixture(),
            packageBudgetResults: {
              ...reportFixture().packageBudgetResults,
              failures: ["fixture refresh budget failure"],
            },
          },
          { diagnosticPath, publicPath },
        ),
      ).toBe(false);
      expect(readFileSync(publicPath, "utf8")).toBe("seeded public\n");
      expect(readFileSync(diagnosticPath, "utf8")).toBe("seeded diagnostic\n");
      expect(publicReport).toContain("Generated: 2030-05-06");
      expect(diagnosticReport).toContain("Generated: 2030-05-06");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("rolls back both reports when the later transactional replacement fails", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "starwind-size-report-rollback-test-"));
    const publicPath = path.join(root, "package-size-comparison.md");
    const diagnosticPath = path.join(root, "diagnostics", "package-size-diagnostics.md");
    mkdirSync(path.dirname(diagnosticPath), { recursive: true });
    writeFileSync(publicPath, "accepted public\n");
    writeFileSync(diagnosticPath, "accepted diagnostic\n");
    let replacements = 0;
    let publicationError;

    try {
      writePackageSizeReports(reportFixture(), {
        diagnosticPath,
        publicationOptions: {
          replaceArtifact(source, destination) {
            replacements += 1;
            if (replacements === 2) throw new Error("simulated diagnostic replacement failure");
            renameSync(source, destination);
          },
        },
        publicPath,
      });
    } catch (error) {
      publicationError = error;
    }

    try {
      expect(publicationError).toMatchObject({
        message: "simulated diagnostic replacement failure",
      });
      expect(readFileSync(publicPath, "utf8")).toBe("accepted public\n");
      expect(readFileSync(diagnosticPath, "utf8")).toBe("accepted diagnostic\n");
      expect(publicationError.packageSizePublication.rollback.complete).toBe(true);
      expect(publicationError.packageSizePublication.staged).toEqual([
        expect.objectContaining({ destination: publicPath, retained: true }),
        expect.objectContaining({ destination: diagnosticPath, retained: true }),
      ]);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe("standalone Color Picker package-size comparison", () => {
  it("reports when the Runtime subpath gzip size is below Zag", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 64_000, 18_000),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result).toEqual({
      advisory: null,
      differenceGzipBytes: 11_000,
      failure: null,
      starwindGzipBytes: 18_000,
      starwindMinifiedBytes: 64_000,
      status: "Below comparator",
      zagGzipBytes: 29_000,
      zagMinifiedBytes: 90_000,
    });
  });

  it("reports equality without turning the comparator into a release gate", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 80_000, 29_000),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result).toEqual(
      expect.objectContaining({
        advisory: null,
        differenceGzipBytes: 0,
        failure: null,
        status: "Equal comparator",
      }),
    );
  });

  it("renders the measured standalone comparison with stable labels and column ordering", () => {
    const comparison = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 47_702, 12_474),
      measurement("@zag-js/color-picker", 91_988, 29_519),
    ]);

    expect(formatColorPickerSizeComparisonMarkdown(comparison)).toEqual([
      "### Standalone Color Picker Comparison",
      "",
      "The Runtime Color Picker subpath is measured independently from Starwind's aggregate support sets. Its absolute cold-import budget is enforced above; the Zag comparison is informational.",
      "",
      "| Check | Starwind minified | Starwind min+gzip | Zag minified | Zag min+gzip | Gzip difference | Comparison |",
      "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
      "| Runtime Color Picker vs Zag Color Picker | 47,702 B (46.6 KiB) | 12,474 B (12.2 KiB) | 91,988 B (89.8 KiB) | 29,519 B (28.8 KiB) | 17,045 B (16.6 KiB) | Below comparator |",
    ]);
  });

  it("makes a larger Runtime subpath informational instead of failing the release", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 92_000, 30_001),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result.status).toBe("Above comparator");
    expect(result.differenceGzipBytes).toBe(-1_001);
    expect(result.failure).toBeNull();
    expect(result.advisory).toBe(
      "Standalone Color Picker comparison advisory: @starwind-ui/runtime/color-picker 30,001 B (29.3 KiB) is above @zag-js/color-picker 29,000 B (28.3 KiB).",
    );
  });

  it.each([
    {
      expected:
        "Standalone Color Picker comparison could not be evaluated: missing @starwind-ui/runtime/color-picker min+gzip measurement.",
      rows: [measurement("@zag-js/color-picker", 90_000, 29_000)],
    },
    {
      expected:
        "Standalone Color Picker comparison could not be evaluated: missing @zag-js/color-picker min+gzip measurement.",
      rows: [measurement("@starwind-ui/runtime/color-picker", 64_000, 18_000)],
    },
  ])("reports unavailable comparator measurements without failing", ({ expected, rows }) => {
    expect(evaluateColorPickerSizeComparison(rows)).toEqual(
      expect.objectContaining({
        advisory: expected,
        failure: null,
        status: "Unavailable",
      }),
    );
  });
});

function measurement(label, minifiedBytes, gzipBytes) {
  return { gzipBytes, label, minifiedBytes };
}

function supportMeasurement(comparisonSet, minifiedBytes, gzipBytes) {
  return { comparisonSet, gzipBytes, minifiedBytes, provider: "starwind" };
}

function componentMeasurement(component, minifiedBytes, gzipBytes) {
  return { component, gzipBytes, minifiedBytes, provider: "starwind" };
}

function payload(label, minifiedBytes, gzipBytes, packageGzipBytes, packageUnpackedBytes) {
  return { gzipBytes, label, minifiedBytes, packageGzipBytes, packageUnpackedBytes };
}

function completeProofMeasurementFixture() {
  return {
    bundleResults: [
      measurement("@starwind-ui/runtime", 100, 10),
      measurement("@starwind-ui/react + runtime", 200, 20),
    ],
    sourcePayloadResults: [
      payload("@starwind-ui/astro", 301, 31, 3_001, 30_001),
      payload("@starwind-ui/react", 302, 32, 3_002, 30_002),
      payload("@starwind-ui/runtime", 303, 33, 3_003, 30_003),
    ],
    supportResults: [
      supportMeasurement("all-three-overlap", 400, 40),
      supportMeasurement("starwind-zag-overlap", 500, 50),
      componentMeasurement("button", 601, 61),
      componentMeasurement("checkbox", 602, 62),
      componentMeasurement("select", 603, 63),
    ],
  };
}

function reportFixture() {
  const supportResults = [
    { comparisonSet: "all-three-overlap", gzipBytes: 1_000, provider: "starwind" },
    { component: "select", gzipBytes: 100, provider: "starwind" },
    { component: "combobox", gzipBytes: 110, provider: "starwind" },
    { component: "menu", gzipBytes: 120, provider: "starwind" },
    { component: "context-menu", gzipBytes: 130, provider: "starwind" },
  ];

  return {
    bundleResults: [
      {
        group: "Starwind",
        gzipBytes: 2_048,
        label: "@starwind-ui/runtime",
        minifiedBytes: 4_096,
        version: "1.0.0",
      },
    ],
    generatedDate: "2030-05-06",
    packageBudgetResults: {
      colorPickerCheck: {
        differenceGzipBytes: 1_000,
        starwindGzipBytes: 1_000,
        starwindMinifiedBytes: 2_000,
        status: "Pass",
        zagGzipBytes: 2_000,
        zagMinifiedBytes: 3_000,
      },
      fieldColdImportChecks: [],
      headlineChecks: [],
      matchedSupportChecks: [],
      standaloneComponentChecks: [],
      vueAbsoluteChecks: [
        {
          baselineGzipBytes: 51_807,
          gzipBytes: 51_807,
          headroomBytes: 2_591,
          id: "vue.adapter-only",
          label: "vue.adapter-only",
          maxGzipBytes: 54_398,
          status: "Pass",
        },
      ],
      vueMatchedSupportCheck: {
        comparatorGzipBytes: 128_292,
        comparisonStatus: "Above comparator",
        starwindGzipBytes: 180_110,
        status: "Pass",
      },
    },
    sourceContributionAnalyses: [],
    sourcePayloadResults: [
      {
        gzipBytes: 512,
        label: "@starwind-ui/runtime",
        minifiedBytes: 1_024,
        packageGzipBytes: 2_048,
        packageUnpackedBytes: 4_096,
        version: "1.0.0",
      },
    ],
    supportResults,
    vueBundleResults: [
      measurement("@starwind-ui/vue (adapter only)", 100, 10),
      measurement("@starwind-ui/vue + runtime", 200, 20),
      {
        ...measurement("@starwind-ui/vue complete catalog", 300, 30),
        dynamicOutput: {
          gzipBytes: 19,
          minifiedBytes: 21,
          paths: ["chunks/vue-dynamic.js"],
        },
      },
    ],
    vueColdImportResults: [{ component: "accordion", gzipBytes: 11, minifiedBytes: 101 }],
    vueMatchedSupportResults: [
      { componentCount: 30, gzipBytes: 31, minifiedBytes: 301, provider: "starwind-vue" },
      { componentCount: 30, gzipBytes: 32, minifiedBytes: 302, provider: "zag-vue" },
    ],
    vuePackagePayload: {
      categories: [{ bytes: 10, fileCount: 1, label: "Runtime-bearing code" }],
      declarationBytes: 12,
      declarationGzipBytes: 13,
      packageGzipBytes: 14,
      packageUnpackedBytes: 15,
      runtimeGzipBytes: 16,
      runtimeMinifiedBytes: 17,
      version: "0.0.0",
    },
    vueProvenance: {
      command: {
        arguments: ["measure-package-sizes.mjs", "--private-vue"],
        executable: "/node",
      },
      commit: "a".repeat(40),
      comparator: { packages: { "@zag-js/vue": "1.42.0" } },
      environment: completeEnvironmentFixture(),
      flags: { gzipLevel: 9, staticGraphHeadlines: true },
      packageVersions: { "@starwind-ui/vue": "0.0.0" },
    },
    vueStyledExclusions: [{ component: "image", reason: "Astro-only Styled contract" }],
    vueStyledPayload: {
      aggregateBytes: 1_024,
      aggregateGzipBytes: 10,
      codeBytes: 1_024,
      codeGzipBytes: 10,
      rootCount: 54,
      typeSourceBytes: 0,
      typeSourceGzipBytes: 0,
    },
  };
}

function completeEnvironmentFixture() {
  return {
    architecture: "x64",
    esbuildVersion: "0.25.0",
    kernelRelease: "6.8.1",
    nodeVersion: "24.0.0",
    npmVersion: "10.0.0",
    osName: "Linux",
    osRelease: "6.8",
    platform: "linux",
    pnpmVersion: "10.0.0",
    zlibVersion: "1.3.1",
  };
}

function outputFile(filePath, text) {
  return {
    contents: Buffer.from(text),
    path: filePath,
    text,
  };
}
