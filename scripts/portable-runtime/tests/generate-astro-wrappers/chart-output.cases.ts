import { chartStyledContract } from "../../contracts/styled/components/chart.js";
import { CHART_SURFACE_PART_NAMES } from "../../renderers/specialized-adapter-spec/index.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

const PART_FILES = CHART_SURFACE_PART_NAMES.map(
  (name) => `Chart${name[0]!.toUpperCase()}${name.slice(1)}.astro`,
);

const DATA_SLOTS = [
  "chart",
  "chart-tooltip-content",
  "chart-tooltip-label",
  "chart-tooltip-item",
  "chart-tooltip-indicator",
  "chart-tooltip-name",
  "chart-tooltip-value",
  "chart-legend",
];

export function defineAstroChartOutputTests(getTempRoot: GetTempRoot): void {
  it("generates the Astro chart Primitive on the Runtime chart subpath", async () => {
    const tempRoot = getTempRoot();
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const files = (await readdir(path.join(outputRoot, "chart"))).sort();

    expect(files).toEqual(
      [...PART_FILES, "ChartLifecycle.astro", "ChartMarkup.ts", "index.ts"].sort(),
    );

    const sources = await Promise.all(
      files.map(async (file) => [file, await readGeneratedFile(outputRoot, `chart/${file}`)]),
    );
    const external = new Set(
      sources.flatMap(([, source]) =>
        [...source!.matchAll(/from "([^"]+)"/g)]
          .map((match) => match[1]!)
          .filter((specifier) => !specifier.startsWith(".")),
      ),
    );
    // No TanStack framework adapter and no TanStack import at all: the Runtime owns the engine.
    expect([...external].sort()).toEqual(["@starwind-ui/runtime/chart", "astro/types"]);

    const allSource = sources.map(([, source]) => source).join("\n");
    for (const slot of DATA_SLOTS) expect(allSource).toContain(`data-slot="${slot}"`);
    for (const slot of [
      "chart-style",
      "chart-surface",
      "chart-legend-item",
      "chart-legend-swatch",
      "chart-legend-icon",
      "chart-legend-label",
    ]) {
      expect(allSource).toContain(`"data-slot": "${slot}"`);
    }

    const root = await readGeneratedFile(outputRoot, "chart/ChartRoot.astro");
    expect(root).toContain("{lifecycle && <ChartLifecycle />}");
    expect(root).toContain("data-sw-chart-input");
    expect(root).not.toMatch(/^<script>/m);
    const lifecycle = await readGeneratedFile(outputRoot, "chart/ChartLifecycle.astro");
    expect(lifecycle).toContain('import { startCharts } from "@starwind-ui/runtime/chart";');

    const index = await readGeneratedFile(outputRoot, "chart/index.ts");
    expect(index).toContain("Chart as ChartPrimitive,");
    expect(index).toContain("export default Chart;");
    for (const name of CHART_SURFACE_PART_NAMES) {
      const key = `${name[0]!.toUpperCase()}${name.slice(1)}`;
      expect(index).toContain(`  ${key}: Chart${key},`);
    }
    for (const helper of ["createChart", "getChartController", "registerChartModules"]) {
      expect(index).toContain(`  ${helper},`);
    }
  });

  it("generates the Astro chart Styled folder with the five parts and no component CSS", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      contracts: [chartStyledContract],
      outputDir: "generated/starwind-runtime",
      primitiveImportBase: "@starwind-ui/astro",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const files = (await readdir(path.join(outputRoot, "chart"))).sort();

    expect(files).toEqual(
      [
        ...chartStyledContract.publicExports.map((part) => `${part}.astro`),
        "index.ts",
        "variants.ts",
      ].sort(),
    );
    for (const file of files) {
      expect(await readGeneratedFile(outputRoot, `chart/${file}`), file).not.toMatch(
        /<style|import "\.\/.*\.css"/,
      );
    }

    const container = await readGeneratedFile(outputRoot, "chart/ChartContainer.astro");
    // The slot collector comes from the chart Primitive, in the same import as the namespace.
    expect(container).toContain(
      'import ChartPrimitive, { collectChartViews } from "@starwind-ui/astro/chart";',
    );
    expect(container).not.toContain('from "@starwind-ui/runtime');
    expect(container).toContain('import type { ChartValue } from "@tanstack/charts";');
    expect(container).toContain('import ChartTooltipContent from "./ChartTooltipContent.astro";');
    expect(container).toContain("fallbackTooltip={ChartTooltipContent}");
    expect(container).toContain('nativeTooltip={tooltip === "native"}');
    expect(container).toContain('await Astro.slots.render("tooltip")');

    const tooltipContent = await readGeneratedFile(outputRoot, "chart/ChartTooltipContent.astro");
    expect(tooltipContent).toContain("labelClass: labelClassName");
    expect(tooltipContent).toContain("<ChartPrimitive.TooltipLabel class={labelClass} />");

    const index = await readGeneratedFile(outputRoot, "chart/index.ts");
    const facadeValues = index
      .match(/export \{([^}]*)\} from "@starwind-ui\/astro\/chart";/)?.[1]
      ?.split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    // Astro also re-exports the page-script helpers, so a chart page needs one component import.
    expect(facadeValues).toEqual([
      "chartStyle",
      "createChart",
      "defineChartModule",
      "getChartController",
      "isChartIcon",
      "registerChartModules",
      "serializeInput",
    ]);
    expect(index).toContain("Container: ChartContainer,");
  });

  it("imports the Astro slot collector from a local chart Primitive", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      contracts: [chartStyledContract],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const container = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "chart/ChartContainer.astro",
    );

    expect(container).toContain(
      'import ChartPrimitive, { collectChartViews } from "../../primitives/astro/chart";',
    );
    expect(container).not.toContain('from "@starwind-ui/runtime');
  });
}
