import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  renderZagFeatureComparisonReport,
  validateZagFeatureComparison,
  writeZagFeatureComparisonReport,
} from "../generate-zag-feature-comparison.mjs";
import {
  comparisonMetadata,
  comparisonRows,
  overlapComponents,
  runtimeOnlyComponents,
} from "../zag-feature-comparison-data.mjs";

describe("Zag feature comparison data", () => {
  it("validates the current overlap inventory", () => {
    expect(
      validateZagFeatureComparison({
        comparisonRows,
        overlapComponents,
        runtimeOnlyComponents,
      }),
    ).toEqual({ errors: [], ok: true });
  });

  it("locks the current overlap and feature-row coverage totals", () => {
    expect(overlapComponents).toHaveLength(29);
    expect(comparisonRows).toHaveLength(132);
  });

  it("rejects missing package-size seed components", () => {
    const result = validateZagFeatureComparison({
      comparisonRows: [],
      overlapComponents: overlapComponents.filter((entry) => entry.component !== "accordion"),
      runtimeOnlyComponents,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Package-size seed component 'accordion' is missing from overlapComponents.",
    );
  });

  it("rejects invalid support statuses", () => {
    const result = validateZagFeatureComparison({
      comparisonRows: [
        {
          category: "State",
          component: "accordion",
          feature: "Example",
          followUpPriority: "none",
          starwind: "yes",
          starwindEvidence: ["packages/runtime/src/components/accordion/accordion.ts"],
          zag: "supported",
          zagEvidence: ["@zag-js/accordion@1.42.0"],
        },
      ],
      overlapComponents,
      runtimeOnlyComponents,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("accordion 'Example' uses invalid Starwind status 'yes'.");
  });

  it("rejects invalid follow-up priorities", () => {
    const result = validateZagFeatureComparison({
      comparisonRows: [
        {
          category: "State",
          component: "accordion",
          feature: "Example",
          followUpPriority: "urgent",
          starwind: "supported",
          starwindEvidence: ["packages/runtime/src/components/accordion/accordion.ts"],
          zag: "supported",
          zagEvidence: ["@zag-js/accordion@1.42.0"],
        },
      ],
      overlapComponents,
      runtimeOnlyComponents,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "accordion 'Example' uses invalid follow-up priority 'urgent'.",
    );
  });

  it("strict validation requires feature rows for every overlap component", () => {
    const result = validateZagFeatureComparison(
      {
        comparisonRows: comparisonRows.filter((row) => row.component !== "toast"),
        overlapComponents,
        runtimeOnlyComponents,
      },
      { requireFeatureRows: true },
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("toast has no feature comparison rows.");
  });

  it("renders the report with overlap and completed media sections", () => {
    const report = renderZagFeatureComparisonReport({
      comparisonRows,
      overlapComponents,
      runtimeOnlyComponents,
    });

    expect(report).toContain("# Zag Runtime Feature Comparison");
    expect(report).toContain(
      `- Starwind evidence date: ${comparisonMetadata.starwindEvidenceDate}`,
    );
    expect(report).toContain(`- Zag evidence date: ${comparisonMetadata.zagEvidenceDate}`);
    expect(report).toContain(`- Zag package version: \`${comparisonMetadata.zagPackageVersion}\``);
    expect(report).toContain(`- Zag package source: \`${comparisonMetadata.zagPackageSource}\``);
    expect(report).toContain("## Public Framing Guardrails");
    expect(report).toContain("## Starwind Strengths");
    expect(report).toContain("## Zag Strengths");
    expect(report).toContain("## Component Summary");
    expect(report).toContain("## Gap Backlog");
    expect(report).toContain("| `navigation-menu` | `@zag-js/navigation-menu` | No | Issue 05 |");
    expect(report).toContain("| Starwind/Zag overlap | 28 | 107.8 KiB | 109.7 KiB | N/A |");
    const zagStrengthsSection = report.slice(
      report.indexOf("## Zag Strengths"),
      report.indexOf("## Component Summary"),
    );
    const zagStrengthVersions = Array.from(
      zagStrengthsSection.matchAll(/@zag-js\/[^`|,\s]+@(\d+\.\d+\.\d+)/g),
      ([, version]) => version,
    );
    expect(zagStrengthVersions.length).toBeGreaterThan(0);
    expect(new Set(zagStrengthVersions)).toEqual(new Set([comparisonMetadata.zagPackageVersion]));
    expect(report).toContain(
      "| Fallback | Fallback delay, missing source handling, srcset-only images, and responsive source changes | `supported` | `partial` | `none` |",
    );
    expect(report).not.toContain("_Feature rows pending._");
  });

  it("accepts a missing private diagnostic after validating source data", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "starwind-zag-check-"));

    try {
      await expect(
        writeZagFeatureComparisonReport({
          check: true,
          outputPath: path.join(root, "diagnostics", "zag-feature-comparison.md"),
          requireFeatureRows: true,
        }),
      ).resolves.toBeUndefined();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("creates the configured diagnostics directory before writing a report", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "starwind-zag-write-"));
    const outputPath = path.join(root, "diagnostics", "zag-feature-comparison.md");

    try {
      await writeZagFeatureComparisonReport({ outputPath, requireFeatureRows: true });

      expect(existsSync(outputPath)).toBe(true);
      expect(readFileSync(outputPath, "utf8")).toContain("# Zag Runtime Feature Comparison");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("enforces exact private diagnostic drift when the artifact exists", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "starwind-zag-check-"));
    const outputPath = path.join(root, "zag-feature-comparison.md");

    try {
      writeFileSync(outputPath, "stale\n");
      await expect(
        writeZagFeatureComparisonReport({ check: true, outputPath, requireFeatureRows: true }),
      ).rejects.toThrow("is out of date");

      writeFileSync(
        outputPath,
        renderZagFeatureComparisonReport({
          comparisonRows,
          overlapComponents,
          runtimeOnlyComponents,
        }),
      );
      await expect(
        writeZagFeatureComparisonReport({ check: true, outputPath, requireFeatureRows: true }),
      ).resolves.toBeUndefined();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("keeps public framing guardrails aligned with public README wording", () => {
    const report = renderZagFeatureComparisonReport({
      comparisonRows,
      overlapComponents,
      runtimeOnlyComponents,
    });
    const framingSection = report.slice(
      report.indexOf("### Size Context"),
      report.indexOf("## Starwind Strengths"),
    );

    expect(framingSection).toContain(
      "Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics",
    );
    expect(framingSection).toContain(
      'Do not claim zero runtime dependencies, full Zag parity, every-framework support, or "Base UI for Astro."',
    );
    expect(framingSection).toContain(
      "These size numbers come from the current package-size report",
    );
  });

  it("renders all table rows with leading and trailing pipes", () => {
    const report = renderZagFeatureComparisonReport({
      comparisonRows,
      overlapComponents,
      runtimeOnlyComponents,
    });
    const tableRows = report
      .split("\n")
      .filter((line) => line.includes(" | ") || line.startsWith("|"));

    expect(tableRows.length).toBeGreaterThan(0);
    expect(tableRows.every((line) => line.startsWith("|") && line.endsWith("|"))).toBe(true);
    expect(report).toContain(
      "| Collections | Filtering, disabled items, active item identity, and dynamic option updates | `supported` | `supported` | `none` |",
    );
  });

  it("does not mark navigation-menu Starwind-only advanced behaviors as Zag supported", () => {
    const overclaimedRows = comparisonRows.filter(
      (row) =>
        row.component === "navigation-menu" &&
        row.zag === "supported" &&
        /touch-hover suppression|morph animation|overflow measurement|placement flips/.test(
          row.feature,
        ),
    );

    expect(overclaimedRows).toEqual([]);
  });

  it("does not mark Starwind toast swipe behavior as confirmed Zag support", () => {
    const overclaimedRows = comparisonRows.filter(
      (row) => row.component === "toast" && row.zag === "supported" && /swipe/i.test(row.feature),
    );

    expect(overclaimedRows).toEqual([]);
  });

  it("does not cite absent Zag file-upload helper names", () => {
    const dropzoneRows = JSON.stringify(
      comparisonRows.filter((row) => row.component === "dropzone"),
    );

    expect(dropzoneRows).not.toMatch(/containsFiles|getPreviewUrl/);
    expect(dropzoneRows).toMatch(/setClipboardFiles|createFileUrl/);
  });

  it("does not claim Zag file-upload item error text support from the local type surface", () => {
    const overclaimedRows = comparisonRows.filter(
      (row) =>
        row.component === "dropzone" &&
        row.zag === "supported" &&
        /item error text/i.test(row.feature),
    );

    expect(overclaimedRows).toEqual([]);
  });

  it("does not mark Starwind duplicate-create toast upserts as confirmed Zag support", () => {
    const overclaimedRows = comparisonRows.filter(
      (row) =>
        row.component === "toast" &&
        row.zag === "supported" &&
        /duplicate (id )?upserts|duplicate-create/i.test(row.feature),
    );

    expect(overclaimedRows).toEqual([]);
  });
});
