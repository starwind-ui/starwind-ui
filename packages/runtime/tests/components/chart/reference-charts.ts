/* oxlint-disable unicorn/no-new-array -- the copy keeps the docs code as it is. */
// A copy of the six docs chart modules (starwind-docs `src/charts/visitor-charts.ts`). The chart
// spec test renders each module and the matching spec, and compares the SVG.
//
// One change from the docs file: the bar and area marks have the ids `bars` and `areas` in place of
// `visitors`. A mark id reaches the SVG only as part of `data-ts-key`. The spec builder names marks
// by kind, so it cannot know a chart's own name.
import type { ChartCurve } from "@tanstack/charts";
import { areaY, barY, defineChart, dot, group, lineY, whenFocused } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { decorative } from "@tanstack/charts/mark/decorative";
import {
  angleGrid,
  focusGroupAngle,
  type PolarLayoutContext,
  pie,
  polar,
  type RadialAreaOptions,
  radialArc,
  radialArea,
  radialBarAngle,
  radialDot,
  radialGrid,
  radialText,
} from "@tanstack/charts/polar";
import { type BandScale, scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { fold } from "@tanstack/charts/transform/fold";
import { stackRowsY } from "@tanstack/charts/transform/stack";

import {
  type ChartConfig,
  type ChartContext,
  type ChartModule,
  defineChartModule,
} from "../../../src/components/chart";

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
            id: "bars",
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
            id: "areas",
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

type Point = readonly [number, number];

function curve(path: (points: readonly Point[], move: boolean) => string): ChartCurve {
  return {
    line: (points) => path(points, true),
    area: (top, bottom) =>
      top.length ? `${path(top, true)}${path([...bottom].reverse(), false)}Z` : "",
  };
}

const start = (points: readonly Point[], move: boolean) =>
  `${move ? "M" : "L"}${points[0]![0]},${points[0]![1]}`;

function linearPath(points: readonly Point[], move: boolean): string {
  return points.map((point, i) => `${i === 0 && move ? "M" : "L"}${point[0]},${point[1]}`).join("");
}

/** Natural cubic spline, the same shape as d3 curveNatural (Recharts `type="natural"`). */
const natural = curve((points, move) => {
  const n = points.length;
  if (n === 0) return "";
  if (n < 3) return linearPath(points, move);
  const controls = (values: number[]) => {
    const m = values.length - 1;
    const a = new Array<number>(m);
    const b = new Array<number>(m);
    const r = new Array<number>(m);
    a[0] = 0;
    b[0] = 2;
    r[0] = values[0]! + 2 * values[1]!;
    for (let i = 1; i < m - 1; i++) {
      a[i] = 1;
      b[i] = 4;
      r[i] = 4 * values[i]! + 2 * values[i + 1]!;
    }
    a[m - 1] = 2;
    b[m - 1] = 7;
    r[m - 1] = 8 * values[m - 1]! + values[m]!;
    for (let i = 1; i < m; i++) {
      const ratio = a[i]! / b[i - 1]!;
      b[i] = b[i]! - ratio;
      r[i] = r[i]! - ratio * r[i - 1]!;
    }
    a[m - 1] = r[m - 1]! / b[m - 1]!;
    for (let i = m - 2; i >= 0; i--) a[i] = (r[i]! - a[i + 1]!) / b[i]!;
    b[m - 1] = (values[m]! + a[m - 1]!) / 2;
    for (let i = 0; i < m - 1; i++) b[i] = 2 * values[i + 1]! - a[i + 1]!;
    return [a, b] as const;
  };
  const [x1, x2] = controls(points.map((point) => point[0]));
  const [y1, y2] = controls(points.map((point) => point[1]));
  let path = start(points, move);
  for (let i = 0; i < n - 1; i++) {
    path += `C${x1[i]},${y1[i]},${x2[i]},${y2[i]},${points[i + 1]![0]},${points[i + 1]![1]}`;
  }
  return path;
});

export const lineChart: VisitorChart = defineChartModule<VisitorRow, VisitorDatum, any, any>({
  id: "chart-line-default",
  ariaLabel: "Line chart of desktop visitors",
  presentation: { hideLabel: true },
  create(ctx) {
    const rows = seriesRows(ctx).filter((row) => row.series === "desktop");
    return defineChart(
      {
        marks: [
          lineY(rows, { ...visitorChannels, id: "lines", curve: natural, strokeWidth: 2 }),
          whenFocused(dot(rows, { ...visitorChannels, id: "active-dots", r: 4 }), { match: "x" }),
        ],
        scales: {
          x: {
            scale: scalePoint<string>().domain(months).padding(0),
            axis: monthAxis("point").axis,
          },
          y: { scale: scaleLinear, nice: true, grid: { stroke: "var(--border)" }, axis: false },
        },
        color: ctx.color,
        theme: ctx.theme,
      },
      interaction(ctx),
    );
  },
});

export const browserData = ["chrome", "safari", "firefox", "edge", "other"].map((browser, i) => ({
  browser,
  visitors: [275, 200, 187, 173, 90][i]!,
}));
export const browserConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig;

type FocusPoint = {
  markId: string;
  x: number;
  y: number;
  xValue: unknown;
  x2Value?: unknown;
  yValue: unknown;
};

interface RadialFocusFrame {
  /** Inner and outer radius in pixels on a 250px chart, as Recharts' chart radii. */
  inner: number;
  outer: number;
  /** TanStack angles in radians for the values 0 and `max`. */
  startAngle: number;
  endAngle: number;
  max: number;
  /** The radius band scale over `inner` to `outer`. */
  band: BandScale<string>;
  /** The id of the radial bar mark. Points of other marks, such as a track, do not count. */
  mark: string;
}

/**
 * Focus for radial bars, as Recharts' tooltip on a radial bar chart: inside the chart's ring and
 * angle range, the pointer focuses every bar of the band nearest by radius. This includes a gap
 * between rings and the track past a bar end. Outside that range, it focuses nothing.
 *
 * A focus gets only the pointer, so it finds the chart center and scale from the bar points.
 * TanStack puts each point at its bar's end angle, on its band's middle radius. The fit needs at
 * least two bar points at different places, so a chart with one bar opens no tooltip.
 */
function focusRadialBand(frame: RadialFocusFrame) {
  const middle = (band: unknown) =>
    (frame.band(String(band)) ?? Number.NaN) + frame.band.bandwidth() / 2;
  const span = frame.endAngle - frame.startAngle;
  const angleOf = (value: number) => frame.startAngle + (span * value) / frame.max;
  const bars = <P extends FocusPoint>(points: readonly P[]) =>
    points.filter((point) => point.markId === frame.mark);
  const band = <P extends FocusPoint>(points: readonly P[], point: P) =>
    bars(points).filter((candidate) => candidate.yValue === point.yValue);
  const mean = (values: readonly number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    resolve<P extends FocusPoint>(points: readonly P[], context: { x: number; y: number }) {
      const members = bars(points);
      // Each point is at center + scale × (r sin a, −r cos a). A least-squares fit over all
      // points gives the center and the scale. It needs two points at different places.
      const units = members.map((point) => {
        const radius = middle(point.yValue);
        const angle = angleOf(Number(point.x2Value ?? point.xValue));
        return { u: radius * Math.sin(angle), v: -radius * Math.cos(angle), point };
      });
      const [mu, mv] = [mean(units.map(({ u }) => u)), mean(units.map(({ v }) => v))];
      const [mx, my] = [mean(members.map(({ x }) => x)), mean(members.map(({ y }) => y))];
      let product = 0;
      let square = 0;
      for (const { u, v, point } of units) {
        product += (point.x - mx) * (u - mu) + (point.y - my) * (v - mv);
        square += (u - mu) ** 2 + (v - mv) ** 2;
      }
      const scale = product / square;
      if (!(scale > 0) || !Number.isFinite(scale)) return [];
      const dx = (context.x - (mx - scale * mu)) / scale;
      const dy = (context.y - (my - scale * mv)) / scale;
      const radius = Math.hypot(dx, dy);
      // Half a unit of slack keeps a pointer on the edge itself inside, despite rounding.
      if (radius < frame.inner - 0.5 || radius > frame.outer + 0.5) return [];
      // The turn from the start angle in the frame's direction. A frame of a full turn or more
      // holds every angle.
      const turn = (Math.atan2(dx, -dy) - frame.startAngle) * Math.sign(span);
      const full = 2 * Math.PI;
      if (Math.abs(span) < full && ((turn % full) + full) % full > Math.abs(span)) return [];
      let nearest: P | undefined;
      for (const point of members) {
        const distance = Math.abs(middle(point.yValue) - radius);
        if (!nearest || distance < Math.abs(middle(nearest.yValue) - radius)) nearest = point;
      }
      return nearest ? band(points, nearest) : [];
    },
    group: <P extends FocusPoint>(points: readonly P[], context: { point: P }) =>
      band(points, context.point),
    navigation: <P extends FocusPoint>(points: readonly P[]) =>
      frame.band
        .domain()
        .flatMap((value) => bars(points).find((point) => String(point.yValue) === value) ?? []),
  };
}

type BrowserRow = (typeof browserData)[number];
export const radialChart = defineChartModule<BrowserRow, any, any, any>({
  id: "chart-radial-simple",
  ariaLabel: "Radial bar chart of visitors by browser",
  host: { aspectRatio: 1 },
  presentation: { hideLabel: true },
  create(ctx) {
    const rows = ctx.data
      .filter((row) => ctx.isVisible(row.browser))
      .map((row) => ({
        ...row,
        id: `visitors-${row.browser}`,
        series: row.browser,
        value: row.visitors,
        band: row.browser,
        bottom: 0,
        top: row.visitors,
      }));
    const max = Math.max(...rows.map((row) => row.top), 1);
    // The ring's inner and outer radius on a 250px chart. The drawn range and the focus share them.
    const [inner, outer] = [30, 110];
    const px = (value: number) => (layout: PolarLayoutContext) => (layout.radius * value * 2) / 250;
    const band = scaleBand<string>()
      .domain(rows.map((row) => row.band))
      .paddingInner(0.2)
      .paddingOuter(0.1);
    const frame = {
      startAngle: Math.PI / 2,
      endAngle: (-3 * Math.PI) / 2,
      scales: {
        angle: { scale: scaleLinear().domain([0, max]) },
        radius: {
          scale: band,
          range: [px(inner), px(outer)] as const,
        },
      },
    };
    return defineChart(
      {
        marks: [
          decorative(
            polar({
              ...frame,
              marks: [
                radialBarAngle(rows, {
                  id: "track",
                  key: "id",
                  angle1: 0,
                  angle2: max,
                  radius: "band",
                  fill: "var(--muted)",
                }),
              ],
            }),
          ),
          polar({
            ...frame,
            marks: [
              radialBarAngle(rows, {
                id: "bars",
                key: "id",
                angle1: "bottom",
                angle2: "top",
                radius: "band",
                color: "series",
              }),
            ],
          }),
        ],
        scales: { x: null, y: null },
        color: ctx.color,
        theme: ctx.theme,
      },
      {
        svgAnimation: false,
        focusRing: false,
        maxFocusDistance: 48,
        focus: focusRadialBand({
          inner,
          outer,
          startAngle: frame.startAngle,
          endAngle: frame.endAngle,
          max,
          band: band.copy().range([inner, outer]),
          mark: "bars",
        }),
        tooltip: ctx.tooltip({ nameKey: "series" }),
      },
    );
  },
});
