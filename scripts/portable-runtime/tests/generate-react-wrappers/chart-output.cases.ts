import { chartStyledContract } from "../../contracts/styled/components/chart.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindReactWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
  starwindStyledContracts,
} from "./shared.js";

const CHART_PARTS = [
  "ChartContainer",
  "ChartTooltip",
  "ChartTooltipContent",
  "ChartLegend",
  "ChartLegendContent",
];

const CHART_VARIANTS = [
  "chartContainer",
  "chartLegend",
  "chartLegendIcon",
  "chartLegendItem",
  "chartLegendSwatch",
  "chartTooltipContent",
  "chartTooltipCustom",
  "chartTooltipIcon",
  "chartTooltipIndicator",
  "chartTooltipItem",
  "chartTooltipLabel",
  "chartTooltipName",
  "chartTooltipValue",
];

async function generateChart(tempRoot: string): Promise<string> {
  await generateStarwindReactWrappers({
    contracts: [chartStyledContract],
    outputDir: "generated/starwind-runtime",
    primitiveImportBase: "@starwind-ui/react",
    primitiveOutputDir: "generated/primitives/react",
    repoRoot: tempRoot,
  });
  return path.join(tempRoot, "generated/starwind-runtime");
}

export function defineReactChartOutputTests(getTempRoot: GetTempRoot): void {
  it("registers a valid chart Styled contract for Astro, React, Vue and Svelte", () => {
    expect(starwindStyledContracts).toContain(chartStyledContract);
    expect(validateStyledAdapterContracts(starwindStyledContracts)).toEqual([]);
    expect(chartStyledContract.frameworks).toEqual(["astro", "react", "vue", "svelte"]);
    expect(chartStyledContract.publicExports).toEqual(CHART_PARTS);
    expect(chartStyledContract.defaultExport).toEqual({
      Container: "ChartContainer",
      Tooltip: "ChartTooltip",
      TooltipContent: "ChartTooltipContent",
      Legend: "ChartLegend",
      LegendContent: "ChartLegendContent",
    });
    expect(Object.keys(chartStyledContract.variants ?? {}).sort()).toEqual(CHART_VARIANTS);
    expect(chartStyledContract.styles).toBeUndefined();
  });

  it("generates the React chart folder with the five parts and no component CSS", async () => {
    const outputRoot = await generateChart(getTempRoot());
    const files = (await readdir(path.join(outputRoot, "chart"))).sort();

    expect(files).toEqual(
      [...CHART_PARTS.map((part) => `${part}.tsx`), "index.ts", "variants.ts"].sort(),
    );
    for (const file of files) {
      expect(await readGeneratedFile(outputRoot, `chart/${file}`), file).not.toMatch(
        /<style|dangerouslySetInnerHTML|import "\.\/.*\.css"/,
      );
    }
  });

  it("generates a generic ChartContainer with the default tooltip and scene theme", async () => {
    const outputRoot = await generateChart(getTempRoot());
    const source = await readGeneratedFile(outputRoot, "chart/ChartContainer.tsx");
    const code = compactCode(source);

    // The constraint type is used only in types, so it is a type import (Biome useImportType).
    expect(source).toContain('import type { ChartValue } from "@tanstack/charts";');
    // React.useMemo is a runtime value, so React is a value import.
    expect(source).toContain('import * as React from "react";');
    // The default body is a raw JSX value, so the writer imports that sibling part.
    expect(source).toContain('import ChartTooltipContent from "./ChartTooltipContent";');
    expect(code).toContain(
      compactCode(`export type ChartContainerProps<
        T = unknown,
        D = unknown,
        X extends ChartValue = ChartValue,
        Y extends ChartValue = ChartValue
      > = import("@starwind-ui/react/chart").ChartRootProps<T, D, X, Y> & {
        // oxlint-disable-next-line typescript/no-redundant-type-constituents -- "native" names the built-in tooltip.
        tooltip?: React.ReactNode | false | "native";
      };`),
    );
    expect(code).toContain(compactCode("(props: ChartContainerProps<T, D, X, Y>)"));
    expect(code).toContain(compactCode('foreground: "var(--muted-foreground)",'));
    expect(code).toContain(compactCode('muted: "var(--muted-foreground)",'));
    expect(code).toContain(compactCode('grid: "var(--border)",'));
    expect(code).toContain(compactCode('background: "transparent", ...theme, }), [theme],'));
    expect(code).toContain(
      compactCode(`<ChartPrimitive.Root
        {...rest}
        theme={sceneTheme}
        disableTooltip={tooltip === false}
        className={chartContainer({ class: className })}
        data-slot="chart"
      >
        <ChartPrimitive.Style />
        <ChartPrimitive.Surface
          tooltip={tooltipContent}
          fallbackTooltip={<ChartTooltipContent />}
          nativeTooltip={tooltip === "native"}
        />
        {children}
      </ChartPrimitive.Root>`),
    );
    expect(code).toContain(
      compactCode(
        'const tooltipContent = tooltip === false || tooltip === "native" ? undefined : tooltip;',
      ),
    );
    expect(code).not.toContain("legend");
  });

  it("generates tooltip parts on the Primitive tooltip content parts", async () => {
    const outputRoot = await generateChart(getTempRoot());
    const tooltip = compactCode(await readGeneratedFile(outputRoot, "chart/ChartTooltip.tsx"));
    const content = compactCode(
      await readGeneratedFile(outputRoot, "chart/ChartTooltipContent.tsx"),
    );

    // Unformatted output keeps parentheses around the fallback element.
    expect(tooltip).toMatch(
      /<ChartPrimitive\.Tooltip>\{content\?\?\(?<ChartTooltipContent\/>\)?\}<\/ChartPrimitive\.Tooltip>/,
    );
    expect(tooltip).toContain(compactCode("content?: React.ReactNode;"));
    expect(content).toContain(
      compactCode(`export type ChartTooltipContentProps<T = unknown> = Omit<
        import("@starwind-ui/react/chart").ChartTooltipContentProps<T>,
        "children"
      > & { labelClassName?: string; };`),
    );
    expect(content).toContain(
      compactCode("function ChartTooltipContent<T = unknown>(props: ChartTooltipContentProps<T>)"),
    );
    expect(content).toContain(
      compactCode("const labelClass = chartTooltipLabel({ class: labelClassName });"),
    );
    expect(content).toContain(
      compactCode(`<ChartPrimitive.TooltipLabel className={labelClass} />
        <ChartPrimitive.TooltipItems>
          <ChartPrimitive.TooltipItem
            className={chartTooltipItem()}
            customClassName={chartTooltipCustom()}
          >
            <ChartPrimitive.TooltipIcon className={chartTooltipIcon()} />
            <ChartPrimitive.TooltipIndicator className={chartTooltipIndicator()} />
            <ChartPrimitive.TooltipName className={chartTooltipName()} labelClassName={labelClass} />
            <ChartPrimitive.TooltipValue className={chartTooltipValue()} />
          </ChartPrimitive.TooltipItem>
        </ChartPrimitive.TooltipItems>`),
    );
  });

  it("generates an opt-in legend that forwards its props to the legend content", async () => {
    const outputRoot = await generateChart(getTempRoot());
    const legend = await readGeneratedFile(outputRoot, "chart/ChartLegend.tsx");
    const content = compactCode(
      await readGeneratedFile(outputRoot, "chart/ChartLegendContent.tsx"),
    );

    expect(legend).not.toContain("ChartPrimitive");
    expect(compactCode(legend)).toContain(
      compactCode(`export type ChartLegendProps = React.ComponentProps<typeof ChartLegendContent> & {
        content?: React.ReactNode;
      };`),
    );
    expect(compactCode(legend)).toMatch(
      /return\(?<>\{content\?\?\(?<ChartLegendContent\{\.\.\.rest\}\/>\)?\}<\/>\)?/,
    );
    expect(content).toContain(
      compactCode(
        `Omit<import("@starwind-ui/react/chart").ChartLegendProps, "children" | "content">`,
      ),
    );
    expect(content).toContain(
      compactCode(`<ChartPrimitive.Legend
        {...rest}
        className={chartLegend({ class: className })}
        data-slot="chart-legend"
      >
        <ChartPrimitive.LegendItems>
          <ChartPrimitive.LegendItem className={chartLegendItem()}>
            <ChartPrimitive.LegendIcon className={chartLegendIcon()} />
            <ChartPrimitive.LegendSwatch className={chartLegendSwatch()} />
            <ChartPrimitive.LegendLabel />
          </ChartPrimitive.LegendItem>
        </ChartPrimitive.LegendItems>
      </ChartPrimitive.Legend>`),
    );
  });

  it("exports the chart parts, variants and Primitive helpers from the index", async () => {
    const outputRoot = await generateChart(getTempRoot());
    const index = compactCode(await readGeneratedFile(outputRoot, "chart/index.ts"));

    expect(index).toContain(
      compactCode(`const ChartParts = {
        Container: ChartContainer,
        Tooltip: ChartTooltip,
        TooltipContent: ChartTooltipContent,
        Legend: ChartLegend,
        LegendContent: ChartLegendContent,
      };`),
    );
    expect(index).toContain(
      compactCode(`const ChartVariants = { ${CHART_VARIANTS.join(", ")}, };`),
    );
    expect(index).toContain(
      compactCode(`export type {
        ChartConfig,
        ChartContext,
        ChartFactory,
        ChartIcon,
        ChartModule,
        ChartSource,
        NativeHostOptions,
        TooltipContentOptions,
        TooltipItem,
      } from "@starwind-ui/react/chart";`),
    );
    expect(index).toContain(
      compactCode('export { defineChartModule, isChartIcon } from "@starwind-ui/react/chart";'),
    );
    expect(index).toContain(compactCode("export default ChartParts;"));
  });

  it("prints a named import that only types read as a type import", async () => {
    const tempRoot = getTempRoot();
    const contract: StyledAdapterContract = {
      component: "named-import-fixture",
      frameworks: ["react"],
      publicExports: ["NamedImportFixture"],
      defaultExport: { Root: "NamedImportFixture" },
      components: [
        {
          exportName: "NamedImportFixture",
          imports: [
            { type: "named", importName: "readValue", source: "fixture-package" },
            { type: "named", importName: "FixtureValue", source: "fixture-package" },
          ],
          props: { fields: [{ name: "value", optional: true, type: "FixtureValue" }] },
          destructure: { props: [{ name: "value" }] },
          render: [
            {
              type: "element",
              tag: "span",
              children: [{ type: "text", value: "{readValue(value)}" }],
            },
          ],
        },
      ],
    };
    await generateStarwindReactWrappers({
      contracts: [contract],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });
    const source = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "named-import-fixture/NamedImportFixture.tsx",
    );

    expect(source).toContain('import { type FixtureValue, readValue } from "fixture-package";');
  });
}
