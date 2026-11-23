import { describe, expect, it } from "vitest";

import { chartRuntimeAdapterContract } from "../contracts/primitive/components/chart.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import {
  printAdapterOutput,
  reactFrameworkAdapter,
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
      "(value: unknown, name: string, item: TooltipItem<T>, index: number, payload: T) => React.ReactNode",
    );
    expect(
      chartPropType(formatter, {
        ChartClass: "unknown",
        ChartContent: "ChartView",
        ChartView: "ChartView",
        T: "any",
      }),
    ).toBe(
      "(value: unknown, name: string, item: TooltipItem<any>, index: number, payload: any) => ChartView",
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
});
