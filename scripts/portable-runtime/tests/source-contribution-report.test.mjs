import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { getPackageSizeBudgetCeilings } from "../package-size-budget-checks.mjs";
import {
  buildColorPickerRebaselineSummary,
  colorPickerRebaselineEvidence,
  formatColorPickerRebaselineMarkdown,
} from "../measure-package-sizes.mjs";
import {
  buildSourceContributionContext,
  buildSourceContributionAnalyses,
  formatSourceContributionMarkdown,
} from "../source-contribution-report.mjs";

const fixtureRepoRoot = path.normalize("C:/repo/starwind-ui");
const fixtureTmpRoot = path.normalize("C:/tmp/starwind-package-size-comparison");
const realRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const packageSizeDiagnosticsPath = path.join(
  realRepoRoot,
  "docs/portable-runtime/diagnostics/package-size-diagnostics.md",
);
const privateDiagnosticsIt = existsSync(packageSizeDiagnosticsPath) ? it : it.skip;

describe("source contribution report", () => {
  it("groups Starwind all-three metafile inputs by source category", () => {
    const [analysis] = buildSourceContributionAnalyses({
      readFile: () => "import './shared.js';\n// src/components/menu/menu.ts\nexport {};",
      repoRoot: fixtureRepoRoot,
      results: [
        {
          label: "All-three overlap - Starwind",
          metafile: fakeMetafile({
            [path.join(fixtureRepoRoot, "packages/runtime/dist/chunk-menu.js")]: 400,
            [path.join(fixtureRepoRoot, "packages/react/dist/chunk-adapter.js")]: 100,
            [path.join(fixtureRepoRoot, "node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs")]:
              50,
            "all-three-overlap-starwind.js": 5,
          }),
          sourceContribution: { label: "All-three overlap - Starwind" },
        },
      ],
      tmpRoot: fixtureTmpRoot,
      topLimit: 5,
    });

    expect(analysis.label).toBe("All-three overlap - Starwind");
    expect(analysis.categories).toEqual([
      { bytes: 400, label: "Runtime" },
      { bytes: 100, label: "React adapter" },
      { bytes: 50, label: "Third-party" },
      { bytes: 5, label: "Other" },
    ]);
    expect(analysis.topStarwindContributors).toEqual([
      {
        bytes: 400,
        category: "Runtime",
        input: "packages/runtime/dist/chunk-menu.js",
        sourceOwner: "src/components/menu/menu.ts",
      },
      {
        bytes: 100,
        category: "React adapter",
        input: "packages/react/dist/chunk-adapter.js",
        sourceOwner: "src/components/menu/menu.ts",
      },
    ]);
  });

  it("normalizes relative and Windows-style metafile paths", () => {
    const runtimeChunk = path.join(fixtureRepoRoot, "packages/runtime/dist/chunk-dialog.js");
    const reactChunk = path.join(fixtureRepoRoot, "packages/react/dist/chunk-adapter.js");
    const [analysis] = buildSourceContributionAnalyses({
      repoRoot: fixtureRepoRoot,
      results: [
        {
          label: "All-three overlap - Starwind",
          metafile: fakeMetafileRaw({
            [path.relative(fixtureTmpRoot, runtimeChunk).replaceAll("/", "\\")]: 250,
            [reactChunk.replaceAll("/", "\\")]: 125,
          }),
          sourceContribution: { label: "All-three overlap - Starwind" },
        },
      ],
      tmpRoot: fixtureTmpRoot,
    });

    expect(analysis.categories).toEqual([
      { bytes: 250, label: "Runtime" },
      { bytes: 125, label: "React adapter" },
    ]);
    expect(analysis.topStarwindContributors.map((contributor) => contributor.input)).toEqual([
      "packages/runtime/dist/chunk-dialog.js",
      "packages/react/dist/chunk-adapter.js",
    ]);
  });

  it("renders a deterministic architecture-only Markdown section", () => {
    const markdown = formatSourceContributionMarkdown(
      [
        {
          categories: [
            { bytes: 400, label: "Runtime" },
            { bytes: 100, label: "React adapter" },
            { bytes: 50, label: "Third-party" },
          ],
          context: {
            componentCount: 26,
            combinedGzipBytes: 96_000,
            interpretation:
              "Use both columns: higher savings can also come from higher isolated imports.",
            isolatedGzipBytes: 200_000,
            sharedSavingsGzipBytes: 104_000,
          },
          label: "All-three overlap - Starwind",
          topStarwindContributors: [
            {
              bytes: 400,
              category: "Runtime",
              input: "packages/runtime/dist/chunk-menu.js",
              sourceOwner: "src/components/menu/menu.ts",
            },
            {
              bytes: 100,
              category: "React adapter",
              input: "packages/react/dist/chunk-adapter.js",
              sourceOwner: "packages/react/dist/chunk-adapter.js",
            },
          ],
          totalBytes: 550,
        },
      ],
      { formatBytes: (bytes) => `${bytes} B` },
    ).join("\n");

    expect(markdown).toContain("### All-three overlap - Starwind");
    expect(markdown).toContain(
      "| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |",
    );
    expect(markdown).toContain(
      "| 26 | 96000 B | 200000 B | 104000 B (52.0%) | Use both columns: higher savings can also come from higher isolated imports. |",
    );
    expect(markdown).toContain("| Runtime | 400 B | 72.7% |");
    expect(markdown).toContain("| 1 | Runtime | `src/components/menu/menu.ts` | 400 B |");
    expect(markdown).toContain(
      "This section is architecture analysis, not an apples-to-apples public marketing table.",
    );
  });

  it("separates multiple source analyses with a blank line", () => {
    const markdown = formatSourceContributionMarkdown(
      [
        minimalAnalysis("All-three overlap - Starwind", "src/components/menu/menu.ts"),
        minimalAnalysis("Field cold import - Starwind", "src/components/field/field.ts"),
      ],
      { formatBytes: (bytes) => `${bytes} B` },
    ).join("\n");

    expect(markdown).toContain(
      "| 1 | Runtime | `src/components/menu/menu.ts` | 10 B |\n\n### Field cold import - Starwind",
    );
  });

  it("builds context with the same isolated sum and savings math as the dedupe table", () => {
    expect(
      buildSourceContributionContext({
        combinedGzipBytes: 94_600,
        componentCount: 2,
        componentRows: [{ gzipBytes: 120_000 }, { gzipBytes: 76_400 }],
        interpretation: "Context",
      }),
    ).toEqual({
      combinedGzipBytes: 94_600,
      componentCount: 2,
      interpretation: "Context",
      isolatedGzipBytes: 196_400,
      sharedSavingsGzipBytes: 101_800,
    });
  });

  it("keeps shared headings public and source-contribution headings private", () => {
    const publicReport = readFileSync(
      path.join(realRepoRoot, "docs/portable-runtime/package-size-comparison.md"),
      "utf8",
    );

    expect(publicReport).toContain("## At A Glance");
    expect(publicReport).toContain("## Starwind-Matched Support");
    expect(publicReport).toContain("## Isolated vs Combined Support Costs");
    expect(publicReport).toContain("## Starwind Component Matches");
    expect(publicReport).not.toContain("## Starwind Source Contribution Analysis");
  });

  privateDiagnosticsIt("keeps source-contribution headings in private diagnostics", () => {
    const diagnosticReport = readFileSync(packageSizeDiagnosticsPath, "utf8");

    expect(diagnosticReport).toContain("## Starwind Source Contribution Analysis");
    expect(diagnosticReport).toContain("### All-three overlap - Starwind");
    expect(diagnosticReport).toContain("### Field cold import - Starwind");
    expect(diagnosticReport).toContain(
      "Cold import baseline for Field; lowering this can be a win even if aggregate savings percentage falls.",
    );
    expect(diagnosticReport.indexOf("## Starwind Source Contribution Analysis")).toBeLessThan(
      diagnosticReport.indexOf("## Starwind Component Matches"),
    );
  });

  it("derives exact Color Picker rebaseline arithmetic from machine-readable evidence", () => {
    const summary = buildColorPickerRebaselineSummary();

    expect(summary.headlineRows).toEqual([
      expect.objectContaining({
        deltaBytes: 13_255,
        label: "@starwind-ui/runtime",
        newCeilingBytes: 127_943,
        newHeadroomBytes: 1_648,
        oldCeilingBytes: 114_688,
        oldHeadroomBytes: 1_648,
        postFeatureBaselineGzipBytes: 126_295,
        preFeatureGzipBytes: 113_040,
      }),
      expect.objectContaining({
        deltaBytes: 4_076,
        label: "@starwind-ui/react (adapter only)",
        newCeilingBytes: 35_820,
        oldHeadroomBytes: 626,
        postFeatureBaselineGzipBytes: 35_194,
        preFeatureGzipBytes: 31_118,
      }),
      expect.objectContaining({
        deltaBytes: 18_460,
        label: "@starwind-ui/react + runtime",
        newCeilingBytes: 166_940,
        oldHeadroomBytes: 2_690,
        postFeatureBaselineGzipBytes: 164_250,
        preFeatureGzipBytes: 145_790,
      }),
    ]);
    expect(summary.overlapBudgetRow).toEqual(
      expect.objectContaining({
        deltaBytes: 2_260,
        newCeilingBytes: 120_020,
        newHeadroomBytes: 1_234,
        oldCeilingBytes: 117_760,
        oldHeadroomBytes: 1_234,
        postFeatureBaselineGzipBytes: 118_786,
        preFeatureGzipBytes: 116_526,
      }),
    );
    expect(summary.overlapOldCeilingOverageBytes).toBe(1_026);
    expect(summary.categoryRows.map((row) => row.deltaBytes)).toEqual([8_302, 0, 0, 0]);
    expect(summary.ownerRows.map((row) => row.deltaBytes)).toEqual([3_948, 3_780, 574, 0]);
    expect(summary.ownerDeltaSumBytes).toBe(summary.runtimeCategoryDeltaBytes);
    expect(summary.ownerDeltaSumBytes).toBe(8_302);
    expect(summary.standaloneComparator).toEqual({
      starwindGzipBytes: 12_474,
      zagGzipBytes: 29_519,
    });
  });

  it("keeps historical rebaseline ceilings as evidence rather than active release gates", () => {
    const summary = buildColorPickerRebaselineSummary();
    const ceilings = getPackageSizeBudgetCeilings();
    const historicalHeadlineCeilings = Object.fromEntries(
      summary.headlineRows.map((row) => [row.label, row.newCeilingBytes]),
    );

    expect(historicalHeadlineCeilings).not.toEqual(ceilings.headline);
    expect(ceilings.headline).toEqual({
      "@starwind-ui/react (adapter only)": 38_713,
      "@starwind-ui/react + runtime": 179_610,
      "@starwind-ui/runtime": 138_924,
    });
    expect(summary.overlapBudgetRow.newCeilingBytes).toBe(120_020);
    expect(ceilings.matchedSupport["starwind-zag-overlap"]).toBe(130_664);
    expect(Object.isFrozen(ceilings)).toBe(true);
    expect(Object.isFrozen(ceilings.headline)).toBe(true);
    expect(Object.isFrozen(ceilings.matchedSupport)).toBe(true);
  });

  it("derives the 28-component overlap membership and excludes Color Picker", () => {
    const summary = buildColorPickerRebaselineSummary();

    expect(summary.membershipCount).toBe(28);
    expect(summary.overlap.components).toHaveLength(28);
    expect(summary.overlap.components).not.toContain(summary.overlap.excludedComponent);
    expect(colorPickerRebaselineEvidence.overlap.components).toEqual(summary.overlap.components);
  });

  privateDiagnosticsIt(
    "keeps the checked report byte-aligned with the generated rebaseline section",
    () => {
      const report = readFileSync(packageSizeDiagnosticsPath, "utf8");
      const expectedBlock = formatColorPickerRebaselineMarkdown().join("\n");
      const generatedBlock = getSection(
        report,
        "### Color Picker Rebaseline Evidence",
        "### Headline Aggregate Regression Guards",
      );

      expect(generatedBlock).toBe(expectedBlock);
      expect(report.match(/### Color Picker Rebaseline Evidence/g)).toHaveLength(1);
      expect(generatedBlock).toContain(
        "| Starwind/Zag overlap | 116,526 B | 118,786 B | +2,260 B | 117,760 B | 1,234 B | 120,020 B | 1,234 B |",
      );
      expect(generatedBlock).toContain("| Runtime category | 318,380 B | 326,682 B | +8,302 B |");
      expect(generatedBlock).toContain("| Color Picker source contribution | 0 B | 0 B | 0 B |");
      expect(generatedBlock).toContain(
        "The overlap is 1,026 B above its old ceiling, but its comparison membership remains 28 and excludes Color Picker.",
      );
      expect(generatedBlock).toContain("Starwind 12,474 B gzip versus Zag 29,519 B gzip.");
    },
  );

  privateDiagnosticsIt(
    "validates the generated architecture section shape and method guardrails",
    () => {
      const report = readFileSync(packageSizeDiagnosticsPath, "utf8");
      const architectureBlock = getSourceContributionBlock(report);
      const normalizedArchitectureBlock = normalizeMarkdownTableRows(architectureBlock);
      const architectureHeadings = [...architectureBlock.matchAll(/^### (.+)$/gm)].map(
        (match) => match[1],
      );

      expect(report).toContain(
        "- Source-contribution rows use esbuild metafile `bytesInOutput` from selected Starwind measurement rows. They are minified byte-attribution diagnostics before gzip, not public package-size comparison rows.",
      );
      expect(report).toContain(
        "- Bundle rows use the generated entry chunk and static import graph; dynamic import chunks are excluded from current min+gzip rows because they remain lazy-loaded.",
      );
      expect(report).toContain(
        "- Use `Starwind-Matched Support` when you want a fair support-surface comparison rather than a whole-catalog comparison.",
      );
      expect(report).toContain(
        "This architecture-only section identifies which Starwind source categories contribute most to selected measured bundles.",
      );
      expect(architectureBlock).toContain(
        "This section is architecture analysis, not an apples-to-apples public marketing table.",
      );
      expect(normalizedArchitectureBlock).toContain(
        "| Category | Minified bytes in output | Share |",
      );
      expect(normalizedArchitectureBlock).toContain(
        "| Rank | Category | Source owner | Minified bytes in output |",
      );
      expect(architectureHeadings).toEqual([
        "All-three overlap - Starwind",
        "Field cold import - Starwind",
      ]);
      expect(architectureHeadings.every((heading) => heading.endsWith(" - Starwind"))).toBe(true);
      expect(normalizedArchitectureBlock).toContain(
        "| 1 | Runtime | `src/components/field/field.ts` |",
      );
      expect(normalizedArchitectureBlock).toContain("| Runtime |");
      expect(normalizedArchitectureBlock).toContain("| React adapter |");
      expect(report).not.toContain("Competitor source contribution");
    },
  );
});

function minimalAnalysis(label, sourceOwner) {
  return {
    categories: [{ bytes: 10, label: "Runtime" }],
    label,
    topStarwindContributors: [
      {
        bytes: 10,
        category: "Runtime",
        input: sourceOwner,
        sourceOwner,
      },
    ],
    totalBytes: 10,
  };
}

function getSourceContributionBlock(report) {
  const start = report.indexOf("## Starwind Source Contribution Analysis");
  const end = report.indexOf("## Starwind Component Matches");

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return report.slice(start, end).trim();
}

function getSection(report, startHeading, endHeading) {
  const start = report.indexOf(startHeading);
  const end = report.indexOf(endHeading);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return report.slice(start, end).trim();
}

function normalizeMarkdownTableRows(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
        return line.trimEnd();
      }

      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((cell) => normalizeMarkdownTableCell(cell));

      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");
}

function normalizeMarkdownTableCell(cell) {
  const trimmed = cell.trim();
  const separator = trimmed.match(/^(:?)-{3,}(:?)$/);

  if (separator) {
    return `${separator[1]}---${separator[2]}`;
  }

  return trimmed;
}

function fakeMetafile(inputs) {
  return {
    outputs: {
      "out.js": {
        inputs: Object.fromEntries(
          Object.entries(inputs).map(([input, bytesInOutput]) => [
            input.replaceAll("\\", "/"),
            { bytesInOutput },
          ]),
        ),
      },
    },
  };
}

function fakeMetafileRaw(inputs) {
  return {
    outputs: {
      "out.js": {
        inputs: Object.fromEntries(
          Object.entries(inputs).map(([input, bytesInOutput]) => [input, { bytesInOutput }]),
        ),
      },
    },
  };
}
