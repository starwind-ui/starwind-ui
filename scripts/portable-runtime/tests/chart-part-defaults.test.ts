import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CHART_MARK_KINDS,
  CHART_PART_DEFAULTS,
  CHART_SPEC_OPTION_DEFAULTS,
} from "../../../packages/runtime/src/components/chart/part-defaults.js";
import {
  chartRuntimeAdapterContract,
  chartSpecOptionNames,
} from "../contracts/primitive/components/chart.js";
import { CHART_SPEC_PART_NAMES } from "../renderers/specialized-adapter-spec/chart-specialized-adapter-spec.js";

/** The contract defaults of each chart spec part, parsed from their TypeScript literals. */
function contractDefaults(): Record<string, Record<string, unknown>> {
  const defaults: Record<string, Record<string, unknown>> = Object.fromEntries(
    CHART_SPEC_PART_NAMES.map((part) => [part, {}]),
  );
  for (const prop of chartRuntimeAdapterContract.props) {
    if (!("defaultValue" in prop)) continue;
    for (const part of prop.targets) {
      if (!(part in defaults)) continue;
      defaults[part]![prop.name] = JSON.parse(prop.defaultValue);
    }
  }
  return defaults;
}

/** The contract defaults of the chart-level spec options, parsed from their TypeScript literals. */
function contractOptionDefaults(): Record<string, unknown> {
  const names = new Set<string>(chartSpecOptionNames);
  return Object.fromEntries(
    chartRuntimeAdapterContract.props
      .filter((prop) => names.has(prop.name) && "defaultValue" in prop)
      .map((prop) => [prop.name, JSON.parse((prop as { defaultValue: string }).defaultValue)]),
  );
}

describe("chart part defaults", () => {
  it("prints the Runtime mark kinds in the Vue legend seed", () => {
    const vue = readFileSync(
      new URL("../../../packages/vue/src/chart/ChartContext.ts", import.meta.url),
      "utf8",
    );
    const list = /const LEGEND_MARKS = new Set<string>\((\[[^\]]*\])\)/.exec(vue)?.[1];
    expect(JSON.parse(list ?? "null")).toEqual([...CHART_MARK_KINDS]);
    // Every mark kind is a part kind with defaults.
    for (const kind of CHART_MARK_KINDS) expect(CHART_PART_DEFAULTS).toHaveProperty(kind);
  });

  it("gives every Runtime part kind a chart spec part", () => {
    expect(Object.keys(CHART_PART_DEFAULTS)).toEqual([...CHART_SPEC_PART_NAMES]);
  });

  it("match between the contract and the Runtime spec builder", () => {
    expect(contractDefaults()).toEqual(CHART_PART_DEFAULTS);
  });

  it("match for the chart-level spec options", () => {
    expect(contractOptionDefaults()).toEqual(CHART_SPEC_OPTION_DEFAULTS);
  });
});
