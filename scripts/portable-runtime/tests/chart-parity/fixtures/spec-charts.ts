// The six docs charts: the reference chart module, its data and its config.
import {
  areaChart,
  barChart,
  browserConfig,
  browserData,
  donutChart,
  lineChart,
  monthConfig,
  radarChart,
  radialChart,
  visitorConfig,
  visitorData,
} from "../../../../../packages/runtime/tests/components/chart/reference-charts.js";
import type { SPEC_CHARTS, SpecCase } from "./cases.js";

export type SpecKind = (typeof SPEC_CHARTS)[number];

const CHARTS = {
  bar: { module: barChart, data: visitorData, config: visitorConfig },
  area: { module: areaChart, data: visitorData, config: visitorConfig },
  line: { module: lineChart, data: visitorData, config: visitorConfig },
  donut: { module: donutChart, data: visitorData, config: monthConfig },
  radar: { module: radarChart, data: visitorData, config: visitorConfig },
  radial: { module: radialChart, data: browserData, config: browserConfig },
} as const;

/**
 * The shadcn pie data and config: a colorless `visitors` key, then one key per browser. The
 * shadcn rows carry a `fill` field too.
 */
export const shadcnPie = {
  data: browserData.map((row) => ({ ...row, fill: `var(--color-${row.browser})` })),
  config: browserConfig,
} as const;

/**
 * shadcn bar-interactive and tooltip-label-custom: the tooltip `nameKey` and `labelKey` name config
 * keys that the rows do not have.
 */
export const tooltipKeysConfig = {
  views: { label: "Page Views" },
  activities: { label: "Activities" },
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
};

/** The chart kind of a spec case. The live and empty cases draw the bar chart data. */
export function specKind(mode: SpecCase): SpecKind {
  const kind = mode.replace(/^spec-(module-)?/, "");
  return kind in CHARTS ? (kind as SpecKind) : "bar";
}

export function specChart(kind: SpecKind): {
  module: (typeof CHARTS)[SpecKind]["module"];
  data: readonly Record<string, unknown>[];
  config: Record<string, { label?: string; color?: string }>;
} {
  return CHARTS[kind] as never;
}

/**
 * The props of a shadcn area gradient: it fades from the top to the bottom. The two charts of the
 * gradient case use the same id with different colors.
 */
export function shadcnGradient(color: string) {
  return {
    id: "fillArea",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "5%", stopColor: color, stopOpacity: 0.8 },
      { offset: "95%", stopColor: color, stopOpacity: 0.1 },
    ],
  } as const;
}

/** The label props of the shadcn label examples: 12px text, 12px above the mark. */
export const shadcnTopLabel = { position: "top", offset: 12, fontSize: 12 } as const;

/**
 * The bar config with a first key that no part draws, as the colorless `visitors` key of a shadcn
 * config, for a legend that lists only the drawn keys.
 */
export const legendFirstConfig = {
  visitors: { label: "Visitors" },
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
};

/** A label and gradient stops that the spec-nested case edits in place. */
export const nestedLabel = () => ({ position: "top" as const, formatter: { prefix: "$" } });
export const nestedStops = () => [
  { offset: 0, stopColor: "red" },
  { offset: 1, stopColor: "red", stopOpacity: 0.2 },
];
