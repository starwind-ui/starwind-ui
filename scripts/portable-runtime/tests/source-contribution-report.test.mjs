import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  buildSourceContributionContext,
  buildSourceContributionAnalyses,
  formatSourceContributionMarkdown,
} from "../source-contribution-report.mjs";

const fixtureRepoRoot = path.normalize("C:/repo/starwind-ui");
const fixtureTmpRoot = path.normalize("C:/tmp/starwind-package-size-comparison");
const realRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

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

  it("keeps public comparison headings in the generated report", () => {
    const report = readFileSync(
      path.join(realRepoRoot, "docs/portable-runtime/package-size-comparison.md"),
      "utf8",
    );

    expect(report).toContain("## At A Glance");
    expect(report).toContain("## Starwind-Matched Support");
    expect(report).toContain("## Isolated vs Combined Support Costs");
    expect(report).toContain("## Starwind Source Contribution Analysis");
    expect(report).toContain("### All-three overlap - Starwind");
    expect(report).toContain("### Field cold import - Starwind");
    expect(report).toContain(
      "Cold import baseline for Field; lowering this can be a win even if aggregate savings percentage falls.",
    );
    expect(report).toContain("## Starwind Component Matches");
    expect(report.indexOf("## Starwind Source Contribution Analysis")).toBeLessThan(
      report.indexOf("## Starwind Component Matches"),
    );
  });

  it("validates the generated architecture section shape and method guardrails", () => {
    const report = readFileSync(
      path.join(realRepoRoot, "docs/portable-runtime/package-size-comparison.md"),
      "utf8",
    );
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
    expect(normalizedArchitectureBlock).toBe(expectedGeneratedArchitectureBlock());
    expect(report).not.toContain("Competitor source contribution");
  });
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

function expectedGeneratedArchitectureBlock() {
  return `## Starwind Source Contribution Analysis

This architecture-only section identifies which Starwind source categories contribute most to selected measured bundles. Use it to guide Runtime module-deepening work; use the matched-support tables above for public package comparisons.

### All-three overlap - Starwind

This section is architecture analysis, not an apples-to-apples public marketing table. It uses esbuild metafile \`bytesInOutput\`, which are minified byte contributions before gzip.

| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |
| ---: | ---: | ---: | ---: | --- |
| 26 | 101.9 KiB | 224.6 KiB | 122.7 KiB (54.6%) | Use both columns: lower combined size is good, but higher savings can also come from higher isolated imports. |

| Category | Minified bytes in output | Share |
| --- | ---: | ---: |
| Runtime | 299.8 KiB | 71.7% |
| React adapter | 102.8 KiB | 24.6% |
| Third-party | 15.4 KiB | 3.7% |
| Other | 91 B | 0.0% |

| Rank | Category | Source owner | Minified bytes in output |
| ---: | --- | --- | ---: |
| 1 | Runtime | \`src/components/select/select.ts\` | 30.4 KiB |
| 2 | Runtime | \`src/components/combobox/combobox.ts\` | 28.4 KiB |
| 3 | Runtime | \`src/components/menu/menu.ts\` | 28.0 KiB |
| 4 | Runtime | \`src/components/slider/slider.ts\` | 19.3 KiB |
| 5 | Runtime | \`src/components/toast/toast.ts\` | 15.0 KiB |
| 6 | React adapter | \`src/combobox/ComboboxClear.tsx\` | 13.7 KiB |
| 7 | Runtime | \`src/components/popover/popover.ts\` | 13.1 KiB |
| 8 | Runtime | \`src/components/scroll-area/scroll-area.ts\` | 12.8 KiB |
| 9 | Runtime | \`src/components/input-otp/input-otp.ts\` | 11.9 KiB |
| 10 | Runtime | \`src/components/tabs/tabs.ts\` | 11.5 KiB |
| 11 | Runtime | \`src/components/tooltip/tooltip.ts\` | 11.4 KiB |
| 12 | Runtime | \`src/components/dialog/dialog.ts\` | 10.9 KiB |

### Field cold import - Starwind

This section is architecture analysis, not an apples-to-apples public marketing table. It uses esbuild metafile \`bytesInOutput\`, which are minified byte contributions before gzip.

| Components | Combined min+gzip | Isolated per-component sum | Shared-code savings | Interpretation |
| ---: | ---: | ---: | ---: | --- |
| 1 | 8.4 KiB | 8.4 KiB | 0 B (0.0%) | Cold import baseline for Field; lowering this can be a win even if aggregate savings percentage falls. |

| Category | Minified bytes in output | Share |
| --- | ---: | ---: |
| Runtime | 25.7 KiB | 85.4% |
| React adapter | 4.4 KiB | 14.6% |
| Other | 16 B | 0.1% |

| Rank | Category | Source owner | Minified bytes in output |
| ---: | --- | --- | ---: |
| 1 | Runtime | \`src/components/field/field.ts\` | 16.2 KiB |
| 2 | Runtime | \`src/components/field/field-control-bridge.ts\` | 4.5 KiB |
| 3 | Runtime | \`src/components/input/input.ts\` | 3.5 KiB |
| 4 | React adapter | \`src/field/FieldControl.tsx\` | 2.6 KiB |
| 5 | Runtime | \`src/internal/dom.ts\` | 1.5 KiB |
| 6 | React adapter | \`src/input/InputRoot.tsx\` | 1.4 KiB |
| 7 | React adapter | \`src/internal/compose-refs.ts\` | 243 B |
| 8 | React adapter | \`packages/react/dist/field/index.js\` | 182 B |`;
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
