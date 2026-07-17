import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  evaluateColorPickerSizeComparison,
  formatColorPickerSizeComparisonMarkdown,
  formatPackageSizeReports,
  writePackageSizeReports,
} from "../measure-package-sizes.mjs";

describe("package-size public and diagnostic reports", () => {
  it("renders one fixture result into matching reports with private sections only in diagnostics", () => {
    const reports = formatPackageSizeReports(reportFixture());
    const publicHeadings = [...reports.publicReport.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1],
    );
    const privateHeadings = [
      "Budget Checks",
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
      expect(publicReport).toContain("Generated: 2030-05-06");
      expect(diagnosticReport).toContain("Generated: 2030-05-06");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe("standalone Color Picker package-size comparison", () => {
  it("passes when the Runtime subpath gzip size does not exceed Zag", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 64_000, 18_000),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result).toEqual({
      differenceGzipBytes: 11_000,
      failure: null,
      starwindGzipBytes: 18_000,
      starwindMinifiedBytes: 64_000,
      status: "Pass",
      zagGzipBytes: 29_000,
      zagMinifiedBytes: 90_000,
    });
  });

  it("passes at the equality boundary with zero gzip headroom", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 80_000, 29_000),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result).toEqual(
      expect.objectContaining({ differenceGzipBytes: 0, failure: null, status: "Pass" }),
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
      "The Runtime Color Picker subpath is measured independently from Starwind's aggregate support sets. Its gzip gate must not exceed the existing standalone Zag Color Picker machine row.",
      "",
      "| Check | Starwind minified | Starwind min+gzip | Zag minified | Zag min+gzip | Gzip headroom | Gate |",
      "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
      "| Runtime Color Picker vs Zag Color Picker | 47,702 B (46.6 KiB) | 12,474 B (12.2 KiB) | 91,988 B (89.8 KiB) | 29,519 B (28.8 KiB) | 17,045 B (16.6 KiB) | Pass |",
    ]);
  });

  it("fails when the Runtime subpath gzip size exceeds Zag", () => {
    const result = evaluateColorPickerSizeComparison([
      measurement("@starwind-ui/runtime/color-picker", 92_000, 30_001),
      measurement("@zag-js/color-picker", 90_000, 29_000),
    ]);

    expect(result.status).toBe("Fail");
    expect(result.differenceGzipBytes).toBe(-1_001);
    expect(result.failure).toBe(
      "Standalone Color Picker comparison failed: @starwind-ui/runtime/color-picker 30,001 B (29.3 KiB) > @zag-js/color-picker 29,000 B (28.3 KiB).",
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
  ])("fails clearly when a required measurement is missing", ({ expected, rows }) => {
    expect(evaluateColorPickerSizeComparison(rows)).toEqual(
      expect.objectContaining({ failure: expected, status: "Fail" }),
    );
  });
});

function measurement(label, minifiedBytes, gzipBytes) {
  return { gzipBytes, label, minifiedBytes };
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
  };
}
