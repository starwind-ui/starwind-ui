// Chart recipes for the demo chart page. They are app code: the Starwind packages ship no recipes.
// Each demo app keeps its own copy, which differs only in the Styled chart import below.
import type { ChartCurve } from "@tanstack/charts";
import { areaY, barY, defineChart, dot, group, whenFocused } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { decorative } from "@tanstack/charts/mark/decorative";
import {
  angleGrid,
  focusGroupAngle,
  pie,
  polar,
  type RadialAreaOptions,
  radialArc,
  radialArea,
  radialDot,
  radialGrid,
  radialText,
} from "@tanstack/charts/polar";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { fold } from "@tanstack/charts/transform/fold";
import { stackRowsY } from "@tanstack/charts/transform/stack";

import {
  type ChartConfig,
  type ChartContext,
  type ChartModule,
  defineChartModule,
} from "../starwind-runtime/chart";

export interface VisitorRow {
  month: string;
  desktop: number | null;
  mobile: number | null;
}

export type VisitorDatum = VisitorRow & { id: string; series: string; value: number | null };

export type VisitorChart = ChartModule<VisitorRow, VisitorDatum, any, any>;

export const months = ["January", "February", "March", "April", "May", "June"];

const desktop = [186, 305, 237, 73, 209, 214];
const mobile = [80, 200, 120, 190, 130, 140];

export const visitorData: VisitorRow[] = months.map((month, i) => ({
  month,
  desktop: desktop[i]!,
  mobile: mobile[i]!,
}));

/** Desktop uses one token. Mobile changes token between light and dark mode. */
export const visitorConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", theme: { light: "var(--chart-2)", dark: "var(--chart-3)" } },
} satisfies ChartConfig;

/** The donut has one series per month, so each slice gets one ramp token. */
export const monthConfig: ChartConfig = Object.fromEntries(
  months.map((month, i) => [
    month,
    { label: month.slice(0, 3), color: `var(--chart-${(i % 5) + 1})` },
  ]),
);

/** Monotone cubic interpolation along x, the same shape as d3 curveMonotoneX. */
function monotonePath(points: readonly (readonly [number, number])[], move: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  const start = `${move ? "M" : "L"}${points[0]![0]},${points[0]![1]}`;
  if (n === 1) return start;
  if (n === 2) return `${start}L${points[1]![0]},${points[1]![1]}`;
  const step = (i: number) => points[i + 1]![0] - points[i]![0];
  const secant = (i: number) => (points[i + 1]![1] - points[i]![1]) / (step(i) || 1);
  const sign = (value: number) => (value < 0 ? -1 : 1);
  const tangents = points.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const [s0, s1, h0, h1] = [secant(i - 1), secant(i), step(i - 1), step(i)];
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  });
  tangents[0] = (3 * secant(0) - tangents[1]!) / 2;
  tangents[n - 1] = (3 * secant(n - 2) - tangents[n - 2]!) / 2;
  let path = start;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const third = (x1 - x0) / 3;
    path += `C${x0 + third},${y0 + third * tangents[i]!},${x1 - third},${y1 - third * tangents[i + 1]!},${x1},${y1}`;
  }
  return path;
}

const monotoneX: ChartCurve = {
  line: (points) => monotonePath(points, true),
  area: (top, bottom) =>
    top.length ? `${monotonePath(top, true)}${monotonePath([...bottom].reverse(), false)}Z` : "",
};

type CurveFactory = NonNullable<RadialAreaOptions<unknown>["curve"]>;

/**
 * Straight segments that close back to the first point, as d3 curveLinearClosed does. A ring whose
 * points all sit on one spot (the radar's inner edge at the center) draws nothing, so no renderer
 * can paint a dot there.
 */
const linearClosed = ((context: CanvasPath) => {
  let points: [number, number][] = [];
  return {
    areaStart() {},
    areaEnd() {},
    lineStart() {
      points = [];
    },
    lineEnd() {
      const [first, ...rest] = points;
      if (!first || rest.every(([x, y]) => x === first[0] && y === first[1])) return;
      context.moveTo(first[0], first[1]);
      for (const [x, y] of rest) context.lineTo(x, y);
      context.closePath();
    },
    point(x: number, y: number) {
      points.push([x, y]);
    },
  };
}) as unknown as CurveFactory;

const numericAxis = {
  scale: scaleLinear,
  nice: true,
  grid: { stroke: "var(--border)" },
  axis: { line: false as const, ticks: { size: 0, count: 5 } },
};

function interaction(ctx: ChartContext<VisitorRow>) {
  return {
    svgAnimation: false as const,
    focusRing: false as const,
    maxFocusDistance: Infinity,
    focus: "group-x" as const,
    tooltip: ctx.tooltip(),
  };
}

function seriesRows(ctx: ChartContext<VisitorRow>): VisitorDatum[] {
  return fold(ctx.data, {
    fields: ["desktop", "mobile"] as const,
    as: { key: "series", value: "value" },
  })
    .map((row) => ({ ...row, id: `${row.month}-${row.series}` }) as VisitorDatum)
    .filter((row) => ctx.isVisible(row.series));
}

function monthAxis(scale: "band" | "point") {
  return {
    scale: () =>
      scale === "band"
        ? scaleBand<string>().domain(months).padding(0.28)
        : scalePoint<string>().domain(months).padding(0.3),
    axis: { line: false, ticks: { size: 0, format: (value: string) => value.slice(0, 3) } },
  };
}

const visitorChannels = {
  id: "visitors",
  x: "month" as const,
  y: "value" as const,
  color: "series" as const,
  key: "id" as const,
};

export const barChart: VisitorChart = defineChartModule<VisitorRow, VisitorDatum, any, any>({
  id: "visitors-bar",
  ariaLabel: "Bar chart of monthly visitors",
  create(ctx) {
    const rows = seriesRows(ctx);
    return defineChart(
      {
        marks: [
          crosshair({
            id: "category-hover",
            x: { band: { fill: "var(--muted)", fillOpacity: 1 } },
            y: false,
            marker: false,
          }),
          barY(rows, {
            ...visitorChannels,
            layout: group({ padding: 0.15 }),
            radius: { end: 4 },
            maxThickness: 52,
          }),
        ],
        scales: { x: monthAxis("band"), y: numericAxis },
        color: ctx.color,
        theme: ctx.theme,
      },
      interaction(ctx),
    );
  },
});

export const areaChart: VisitorChart = defineChartModule<VisitorRow, VisitorDatum, any, any>({
  id: "visitors-area",
  ariaLabel: "Stacked area chart of monthly visitors",
  create(ctx) {
    const rows = seriesRows(ctx);
    return defineChart(
      {
        marks: [
          areaY(rows, {
            ...visitorChannels,
            curve: monotoneX,
            fillOpacity: 0.22,
            strokeWidth: 2,
            stroke: (row: VisitorDatum) => `var(--color-${row.series})`,
          }),
          whenFocused(
            dot(stackRowsY(rows, { x: "month", y: "value", z: "series" }), {
              id: "active-values",
              x: "month",
              y: "y2",
              z: "series",
              color: "series",
              key: "id",
              r: 4,
              stroke: "var(--card)",
              strokeWidth: 2,
            }),
            { match: "x" },
          ),
        ],
        scales: { x: monthAxis("point"), y: numericAxis },
        color: ctx.color,
        theme: ctx.theme,
      },
      interaction(ctx),
    );
  },
});

export const donutChart: VisitorChart = defineChartModule<VisitorRow, VisitorDatum, any, any>({
  id: "visitors-donut",
  ariaLabel: "Donut chart of desktop visitors by month",
  create(ctx) {
    const data = ctx.data
      .filter((row) => ctx.isVisible(row.month))
      .map((row) => ({ ...row, value: row.desktop, series: row.month, id: row.month }));
    const total = data.reduce((sum, row) => sum + (row.value ?? 0), 0);
    const arcs = pie(data, { value: "value", gapAngle: 0.025 });
    return defineChart(
      {
        marks: [
          polar({
            radiusRatio: 0.9,
            scales: { angle: null, radius: null },
            marks: [
              radialArc(arcs, {
                id: "slices",
                color: "month",
                key: "id",
                innerRadius: (c: { radius: number }) => c.radius * 0.65,
                stroke: "var(--card)",
                strokeWidth: 2,
              }),
            ],
          }),
          decorative(
            polar({
              scales: {
                angle: { scale: scaleLinear().domain([0, 1]) },
                radius: { scale: scaleLinear().domain([0, 1]) },
              },
              marks: [
                radialText([{ total }], {
                  id: "visible-total",
                  angle: 0,
                  radius: 0,
                  text: (row: { total: number }) => row.total.toLocaleString("en-US"),
                  fontSize: 28,
                  fill: "var(--foreground)",
                }),
              ],
            }),
          ),
        ],
        scales: { x: null, y: null },
        color: ctx.color,
        theme: ctx.theme,
      },
      { ...interaction(ctx), focus: undefined, maxFocusDistance: 48 },
    );
  },
});

export const radarChart: VisitorChart = defineChartModule<VisitorRow, VisitorDatum, any, any>({
  id: "visitors-radar",
  ariaLabel: "Radar chart of monthly visitors",
  create(ctx) {
    const rows = seriesRows(ctx);
    const scales = {
      angle: { scale: scalePoint<string>().domain(months), wrap: true },
      radius: { scale: scaleLinear().domain([0, 350]) },
    };
    const channels = {
      angle: "month" as const,
      radius: "value" as const,
      z: "series" as const,
      color: "series" as const,
      key: "id" as const,
    };
    return defineChart(
      {
        marks: [
          polar({
            radiusRatio: 0.72,
            scales,
            marks: [
              radialArea(rows, {
                ...channels,
                id: "radar",
                curve: linearClosed,
                fillOpacity: 0.18,
                strokeWidth: 2,
                stroke: (row: VisitorDatum) => `var(--color-${row.series})`,
              }),
            ],
            guides: [
              radialGrid({ shape: "polygon", ticks: 4, stroke: "var(--border)" }),
              angleGrid({
                format: (value: unknown) => String(value).slice(0, 3),
                stroke: "var(--border)",
              }),
            ],
          }),
          whenFocused(
            polar({
              radiusRatio: 0.72,
              scales,
              marks: [
                radialDot(rows, {
                  ...channels,
                  id: "active-values",
                  r: 4,
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }),
              ],
            }),
            { match: "group" },
          ),
        ],
        scales: { x: null, y: null },
        color: ctx.color,
        theme: ctx.theme,
      },
      { ...interaction(ctx), focus: focusGroupAngle, maxFocusDistance: 48 },
    );
  },
});
