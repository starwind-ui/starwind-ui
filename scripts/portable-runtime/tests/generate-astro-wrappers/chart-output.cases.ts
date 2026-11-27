import { chartStyledContract } from "../../contracts/styled/components/chart.js";
import {
  CHART_SPEC_PART_NAMES,
  CHART_SURFACE_PART_NAMES,
} from "../../renderers/specialized-adapter-spec/index.js";
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

const pascal = (name: string) => `${name[0]!.toUpperCase()}${name.slice(1)}`;
const PART_FILES = [...CHART_SURFACE_PART_NAMES, ...CHART_SPEC_PART_NAMES].map(
  (name) => `Chart${pascal(name)}.astro`,
);
const SPEC_PART_EXPORTS = CHART_SPEC_PART_NAMES.map((name) => `Chart${pascal(name)}`);

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
    for (const name of [...CHART_SURFACE_PART_NAMES, ...CHART_SPEC_PART_NAMES]) {
      const key = pascal(name);
      expect(index).toContain(`  ${key}: Chart${key},`);
    }
    for (const type of ["ChartFormat,", "ChartRootSpecProps,", "ChartXAxisProps,"])
      expect(index).toContain(`  ${type}`);
    for (const helper of ["createChart", "getChartController", "registerChartModules"]) {
      expect(index).toContain(`  ${helper},`);
    }
  });

  it("generates Astro chart spec parts that the Root collects into a chart spec", async () => {
    const tempRoot = getTempRoot();
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });
    const outputRoot = path.join(tempRoot, "generated/primitives/astro");

    // Each part writes one marker with its kind and renders nothing else.
    for (const name of CHART_SPEC_PART_NAMES) {
      const source = await readGeneratedFile(outputRoot, `chart/Chart${pascal(name)}.astro`);
      expect(source).toContain(`type Props = Chart${pascal(name)}Props;`);
      expect(source).toContain(`<Fragment set:html={chartSpecPart("${name}", Astro.props)} />`);
      expect(source).not.toMatch(/<(div|span|template|svg)/);
    }

    const markup = await readGeneratedFile(outputRoot, "chart/ChartMarkup.ts");
    // Each part sends only its own props, with the Recharts names of the spec table.
    expect(markup).toContain('  bar: ["dataKey", "stackId", "radius", "fill", "label"],');
    expect(markup).toMatch(/ {2}pie: \[[^\]]*"nameKey",[^\]]*"stroke",[^\]]*"paddingAngle",?\s*\]/);
    expect(markup).toContain(
      '  yAxis: ["tickFormatter", "tickLine", "axisLine", "tickMargin", "hide", "tickCount"],',
    );
    expect(markup).toContain(
      '  label: ["position", "value", "dy", "fontSize", "fontWeight", "fill"],',
    );
    // Astro takes only format objects for formatters.
    expect(markup).toContain("  tickFormatter?: ChartFormat;");
    expect(markup).not.toContain("ChartTickFormatter");
    expect(markup).toContain("    formatter?: ChartFormat;");
    expect(markup).toContain("    labelFormatter?: ChartFormat;");
    expect(markup).toContain("assertChartSpecWire({ parts: [part as unknown as ChartPart] });");
    expect(markup).toContain("export function collectChartSpec(");
    expect(markup).toContain("| ChartRootSpecProps<T, D, X, Y>;");

    const root = await readGeneratedFile(outputRoot, "chart/ChartRoot.astro");
    expect(root).toContain(
      "const { html: content, spec } = collectChartSpec(rendered, { stackOffset });",
    );
    expect(root).toContain("if (spec && (chart !== undefined || definition !== undefined)) {");
    expect(root).toContain("...(spec ? { spec } : {}),");
    expect(root).toContain(
      "const lifecycle = interactive && (moduleId !== undefined || spec !== undefined);",
    );
    expect(root).toContain(
      "const chartHost = spec && ariaLabel != null ? { ...host, ariaLabel: String(ariaLabel) } : host;",
    );
    expect(root).toContain("aria-label={spec ? undefined : ariaLabel}");

    const tooltipContent = await readGeneratedFile(outputRoot, "chart/ChartTooltipContent.astro");
    expect(tooltipContent).toContain(
      'assertChartFormat("ChartTooltipContent formatter", formatter);',
    );
    expect(tooltipContent).toContain(
      'assertChartFormat("ChartTooltipContent labelFormatter", labelFormatter);',
    );
  });

  it("exports the chart spec Styled parts and ChartFormat for every target", () => {
    expect(chartStyledContract.publicExports).toEqual(expect.arrayContaining(SPEC_PART_EXPORTS));
    expect(chartStyledContract.defaultExport.XAxis).toBe("ChartXAxis");
    expect(chartStyledContract.primitiveFacadeExports?.types).toContain("ChartFormat");
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
    expect(index).toContain("  XAxis: ChartXAxis,");
    expect(index).toMatch(
      /export type \{[^}]*\bChartFormat\b[^}]*\} from "@starwind-ui\/astro\/chart";/,
    );

    // A Styled spec part only forwards its props to the Primitive part.
    for (const name of SPEC_PART_EXPORTS) {
      const source = await readGeneratedFile(outputRoot, `chart/${name}.astro`);
      expect(source).toContain(`type Props = import("@starwind-ui/astro/chart").${name}Props;`);
      expect(source).toContain(`<ChartPrimitive.${name.slice("Chart".length)} {...rest} />`);
    }
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
