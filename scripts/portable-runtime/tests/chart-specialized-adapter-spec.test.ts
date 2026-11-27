import { describe, expect, it } from "vitest";

import { chartRuntimeAdapterContract } from "../contracts/primitive/components/chart.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import {
  getPrimitiveFrameworkAdapterTarget,
  printAdapterOutput,
  reactFrameworkAdapter,
  svelteFrameworkAdapter,
  vueFrameworkAdapter,
} from "../renderers/framework-adapters/index.js";
import { getPrimitiveFrameworkAdapterTargetsForComponent } from "../renderers/framework-adapters/target-registry.js";
import {
  getPrimitivePackageExportNamesForTarget,
  isPrimitiveInventoryComponentAvailableForTarget,
} from "../renderers/primitive-inventory.js";
import {
  chartProp,
  chartPropType,
  chartPublicTypes,
} from "../renderers/specialized-adapter-spec/chart-specialized-adapter-spec.js";
import {
  buildChartAdapterOutputModel,
  buildChartSpecializedAdapterSpec,
  CHART_SURFACE_PART_NAMES,
  validateChartSpecializedAdapterSpec,
} from "../renderers/specialized-adapter-spec/index.js";

const contract = chartRuntimeAdapterContract as RuntimeAdapterContract;

describe("Chart specialized adapter spec", () => {
  it("builds the public part names, data-slot values and namespace from the contract", () => {
    const spec = buildChartSpecializedAdapterSpec(contract);
    const parts = spec.chart.facts.parts;

    expect(validateChartSpecializedAdapterSpec(spec)).toEqual([]);
    expect(buildChartSpecializedAdapterSpec(contract)).toEqual(spec);
    expect(CHART_SURFACE_PART_NAMES.map((name) => parts[name].namespaceKey)).toEqual([
      "Root",
      "Style",
      "Surface",
      "Tooltip",
      "TooltipContent",
      "TooltipLabel",
      "TooltipItems",
      "TooltipItem",
      "TooltipIndicator",
      "TooltipIcon",
      "TooltipName",
      "TooltipValue",
      "Legend",
      "LegendItems",
      "LegendItem",
      "LegendSwatch",
      "LegendIcon",
      "LegendLabel",
    ]);
    expect(CHART_SURFACE_PART_NAMES.map((name) => parts[name].dataSlot).filter(Boolean)).toEqual([
      "chart",
      "chart-style",
      "chart-surface",
      "chart-tooltip-content",
      "chart-tooltip-label",
      "chart-tooltip-item",
      "chart-tooltip-indicator",
      "chart-tooltip-icon",
      "chart-tooltip-name",
      "chart-tooltip-value",
      "chart-legend",
      "chart-legend-item",
      "chart-legend-swatch",
      "chart-legend-icon",
      "chart-legend-label",
    ]);
    expect(parts.tooltipItems.iterates).toBe("tooltip-rows");
    expect(parts.legendItems.iterates).toBe("legend-keys");
    expect(spec.chart.facts.exports).toMatchObject({
      namespace: "Chart",
      namespaceAlias: "ChartPrimitive",
      runtimeImportSource: "@starwind-ui/runtime/chart",
    });
    expect(spec.chart.facts.visibility).toEqual({
      callbackProp: "onVisibleChange",
      controlledProp: "visible",
      defaultProp: "defaultVisible",
      domEvent: "starwind-chart:visible-change",
      valueProperty: "visible",
    });
  });

  it("reads part elements, data-slots and props from the contract", () => {
    const broken = structuredClone(contract) as RuntimeAdapterContract;
    const legend = broken.parts.find((part) => part.name === "legend")!;
    legend.initialAttributes = legend.initialAttributes!.map((attribute) =>
      attribute.name === "data-slot" ? { ...attribute, value: "legend" } : attribute,
    );
    const parts = buildChartSpecializedAdapterSpec(broken).chart.facts.parts;

    expect(parts.legend.dataSlot).toBe("legend");
    expect(parts.legendItem.element).toBe("button");
    expect(parts.tooltipItems.element).toBeUndefined();
    expect(parts.tooltipItem.props).toEqual([
      {
        classHook: true,
        description: "The class for a row that a tooltip formatter replaced.",
        kind: "attribute",
        name: "customClass",
        type: "ChartClass",
      },
    ]);
    expect(parts.legendItems.props.map((prop) => prop.name)).toEqual(["children"]);
  });

  it("names contract prop types with framework words", () => {
    const facts = buildChartSpecializedAdapterSpec(contract).chart.facts;
    const formatter = chartProp(facts, "tooltipContent", "formatter");

    expect(
      chartPropType(formatter, {
        ChartClass: "string",
        ChartContent: "React.ReactNode",
        ChartView: "React.ReactNode",
      }),
    ).toBe(
      "((value: unknown, name: string, item: TooltipItem<T>, index: number, payload: T) => React.ReactNode) | ChartFormat",
    );
    expect(
      chartPropType(formatter, {
        ChartClass: "unknown",
        ChartContent: "ChartView",
        ChartView: "ChartView",
        T: "any",
      }),
    ).toBe(
      "((value: unknown, name: string, item: TooltipItem<any>, index: number, payload: any) => ChartView) | ChartFormat",
    );
    expect(chartPublicTypes(facts).context).toEqual([
      "ChartView",
      "ChartTooltipBody",
      "ChartRootState",
    ]);
  });

  it("reports duplicate data-slot values and a foreign Runtime import", () => {
    const spec = buildChartSpecializedAdapterSpec(contract);
    const broken = structuredClone(spec);
    broken.chart.facts.parts.legend.dataSlot = "chart";
    broken.chart.facts.runtime.importSource = "@starwind-ui/runtime";

    expect(validateChartSpecializedAdapterSpec(broken)).toEqual(
      expect.arrayContaining([
        'Duplicate chart data-slot "chart".',
        "Chart adapters import only the @starwind-ui/runtime/chart subpath.",
      ]),
    );
  });

  it("describes one component file per part and a chart-surface index", () => {
    const model = buildChartAdapterOutputModel(buildChartSpecializedAdapterSpec(contract));
    const components = model.files.filter((file) => file.kind === "component");
    const indexes = model.files.filter((file) => file.kind === "index");

    expect(components.map((file) => file.path)).toEqual(
      CHART_SURFACE_PART_NAMES.map(
        (name) => `chart/Chart${name[0]!.toUpperCase()}${name.slice(1)}`,
      ),
    );
    expect(
      components.every(
        (file) =>
          (file.component.family as { kind?: string } | undefined)?.kind === "chart-surface",
      ),
    ).toBe(true);
    expect(indexes).toHaveLength(1);
    expect(indexes[0]!.path).toBe("chart/index.ts");
    expect((indexes[0]!.family as { kind?: string } | undefined)?.kind).toBe("chart-surface");
  });

  it("prints React parts that import only the Runtime chart subpath", () => {
    const printed = printAdapterOutput(
      reactFrameworkAdapter,
      buildChartAdapterOutputModel(buildChartSpecializedAdapterSpec(contract)),
    );
    const externalImports = new Set(
      printed.flatMap((file) =>
        [...file.contents.matchAll(/from "([^".][^"]*)"/g)].map((match) => match[1]),
      ),
    );

    expect(printed).toHaveLength(CHART_SURFACE_PART_NAMES.length + 1);
    expect([...externalImports].sort()).toEqual([
      "@starwind-ui/runtime/chart",
      "react",
      "react-dom",
    ]);
    const index = printed.find((file) => file.path === "chart/index.ts")!.contents;
    expect(index).toContain("const Chart = {");
    expect(index).toContain("Chart as ChartPrimitive,");
    expect(index).toContain("export default Chart;");
  });

  it("generates chart for Astro, React, Vue and Svelte with no target gate", () => {
    for (const target of ["astro", "react", "vue", "svelte"]) {
      expect(isPrimitiveInventoryComponentAvailableForTarget("chart", target)).toBe(true);
      expect(getPrimitivePackageExportNamesForTarget(target)).toContain("chart");
    }
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("chart")).toEqual(
      getPrimitiveFrameworkAdapterTargetsForComponent("carousel"),
    );
  });

  /** The printed chart files of one target, by path, after the target's specialized projection. */
  function printTarget(
    target: "react" | "vue" | "svelte",
    source: RuntimeAdapterContract = contract,
  ): Map<string, string> {
    const adapter = {
      react: reactFrameworkAdapter,
      vue: vueFrameworkAdapter,
      svelte: svelteFrameworkAdapter,
    }[target];
    const model = buildChartAdapterOutputModel(buildChartSpecializedAdapterSpec(source));
    const project =
      getPrimitiveFrameworkAdapterTarget(target).primitive.outputModel?.projectSpecialized;
    const printed = printAdapterOutput(adapter, project ? project(model) : model);
    return new Map(printed.map((file) => [file.path, file.contents]));
  }

  it("casts a bare boolean or object prop to true in Vue, from the contract marker", () => {
    // The marker decides, so a type that names the object first still casts.
    const reordered = {
      ...contract,
      props: contract.props.map((prop) =>
        prop.name === "dot" ? { ...prop, type: "{ r?: number } | boolean" } : prop,
      ),
    } as RuntimeAdapterContract;
    const line = printTarget("vue", reordered).get("chart/ChartLine.vue")!;
    expect(line).toMatch(/dot: \{\s*type: \[Boolean, Object\]/);
    expect(line).toMatch(/activeDot: \{\s*type: \[Boolean, Object\]/);
  });

  it.each([
    ["react", "tsx"],
    ["vue", "vue"],
    ["svelte", "svelte"],
  ] as const)(
    "prints the twelve %s spec parts that register with the Root",
    (target, extension) => {
      const files = printTarget(target);
      for (const part of [
        "Bar",
        "Line",
        "Area",
        "Pie",
        "Radar",
        "RadialBar",
        "XAxis",
        "YAxis",
        "Grid",
        "PolarGrid",
        "PolarAngleAxis",
        "Label",
      ]) {
        const kind = `${part[0]!.toLowerCase()}${part.slice(1)}`;
        const source = files.get(`chart/Chart${part}.${extension}`);
        expect(source, part).toBeDefined();
        expect(source, part).toContain(`useChartSpecPart("${kind}", props)`);
      }
      const index = files.get("chart/index.ts")!;
      expect(index).toContain("Bar: ChartBar");
      expect(index).toContain("ChartBarProps");
      expect(index).toContain("ChartRootSpecProps");
      expect(index).toContain("ChartFormat");
    },
  );

  it("prints a React part that renders nothing and carries its kind for the server walk", () => {
    const files = printTarget("react");
    const bar = files.get("chart/ChartBar.tsx")!;
    expect(bar).toContain("function ChartBar(props: ChartBarProps): null {");
    expect(bar).toContain('ChartBar.chartSpecPart = "bar" as const;');
    expect(bar).toContain("dataKey: string;");
    expect(files.get("chart/ChartXAxis.tsx")).toContain("tickFormatter?: ChartTickFormatter;");
    const root = files.get("chart/ChartRoot.tsx")!;
    // The server render and hydration draw the parts among the children.
    expect(root).toContain("return buildChartSpec(collectChartSpec(children), { stackOffset });");
    expect(root).toContain("aria-label={partsMode ? undefined : ariaLabel}");
    expect(files.get("chart/ChartSurface.tsx")).toContain("warnEmptyChart(root.id)");
  });

  it("prints a Vue part with runtime props and a Surface that waits on the server", () => {
    const files = printTarget("vue");
    const grid = files.get("chart/ChartGrid.vue")!;
    expect(grid).toContain("vertical: { type: Boolean, default: undefined },");
    expect(files.get("chart/ChartBar.vue")).toContain(
      'dataKey: { type: null as unknown as PropType<ChartBarProps["dataKey"]>, required: true },',
    );
    const surface = files.get("chart/ChartSurface.vue")!;
    expect(surface).toContain(
      "if (root.partsMode) onServerPrefetch(() => void (initial = prerender()));",
    );
    expect(surface).toContain('"data-allow-mismatch": root.partsMode ? "style" : undefined,');
    expect(files.get("chart/ChartRoot.vue")).toContain(
      "ariaLabel: { type: String, default: undefined },",
    );
  });

  it("prints a Svelte Root that probes its parts on the server", () => {
    const files = printTarget("svelte");
    const root = files.get("chart/ChartRoot.svelte")!;
    expect(root).toContain('const probing = typeof document === "undefined"');
    expect(root).toContain(
      "{#if probing}<ChartContextProvider {probe} {children} />{/if}{@render children?.()}",
    );
    expect(files.get("chart/ChartContextProvider.svelte")).toContain(
      '{:else if role === "probe"}<template>{@render children?.()}</template>',
    );
    expect(files.get("chart/ChartSurface.svelte")).toContain(
      "<!-- svelte-ignore hydration_html_changed -->",
    );
  });
});
