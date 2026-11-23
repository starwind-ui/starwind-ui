// Chart gallery catalog for the demo chart gallery. It is app code: the Starwind packages ship no
// catalog. Each demo app keeps its own copy, which differs only in the Styled chart import below.
// The variants, data, config and card text follow shadcn's chart gallery (`/charts`).
import type { ChartCurve } from "@tanstack/charts";
import {
  areaY,
  barX,
  barY,
  defineChart,
  dot,
  group,
  lineY,
  text,
  tickX,
  whenFocused,
} from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { decorative } from "@tanstack/charts/mark/decorative";
import {
  angleGrid,
  focusGroupAngle,
  type PolarGuide,
  type PolarLayoutContext,
  pie,
  polar,
  type RadialAreaOptions,
  radialArc,
  radialArea,
  radialBarAngle,
  radialDot,
  radialGrid,
  radialRule,
  radialText,
} from "@tanstack/charts/polar";
import { type BandScale, scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";

import {
  type ChartConfig,
  type ChartContext,
  type ChartIcon,
  type ChartModule,
  defineChartModule,
} from "../../starwind-runtime/chart";

export type ChartGalleryType = "area" | "bar" | "line" | "pie" | "radar" | "radial" | "tooltip";

/** The gallery nav, in shadcn order. */
export const chartGalleryTypes: readonly { type: ChartGalleryType; label: string }[] = [
  { type: "area", label: "Area Charts" },
  { type: "bar", label: "Bar Charts" },
  { type: "line", label: "Line Charts" },
  { type: "pie", label: "Pie Charts" },
  { type: "radar", label: "Radar Charts" },
  { type: "radial", label: "Radial Charts" },
  { type: "tooltip", label: "Tooltips" },
];

export type ChartGalleryRow = Record<string, string | number>;

export type ChartGalleryChart = ChartModule<ChartGalleryRow, any, any, any>;

export interface ChartGalleryFooter {
  trend: string;
  detail: string;
}

/** A time range select, as in shadcn's interactive area chart. */
export interface ChartGalleryRangeControl {
  kind: "range";
  label: string;
  initial: string;
  options: readonly { value: string; label: string; days: number }[];
}

/** Series buttons with totals, as in shadcn's interactive bar and line charts. */
export interface ChartGallerySeriesControl {
  kind: "series";
  initial: string;
  options: readonly { key: string; label: string; total: string }[];
}

/** A select that picks the active slice, as in shadcn's interactive pie chart. */
export interface ChartGalleryActiveControl {
  kind: "active";
  label: string;
  /** The row field that the option values match. */
  field: string;
  initial: string;
  options: readonly { value: string; label: string }[];
}

export type ChartGalleryControl =
  | ChartGalleryRangeControl
  | ChartGallerySeriesControl
  | ChartGalleryActiveControl;

/**
 * One formatted tooltip row as plain data. Astro builds it as DOM nodes from the module's
 * `domPresentation`, and the React, Vue and Svelte cards render the same data as views.
 */
export type ChartGalleryTooltipRow =
  | { kind: "unit"; name: string; value: string; unit: string }
  | {
      kind: "swatch";
      /** The config key of the swatch color. */
      key: string;
      name: string;
      value: string;
      unit: string;
      /** A total line under the row, in the same unit. */
      total?: string;
    };

/** shadcn's `formatter` and `labelFormatter` props, written once for every framework. */
export interface ChartGalleryFormat {
  row?: (
    value: unknown,
    name: string,
    item: { payload: Record<string, unknown> },
    index: number,
  ) => ChartGalleryTooltipRow;
  label?: (label: unknown) => string;
}

/** Classes of the formatted tooltip rows, copied from shadcn's formatter examples. */
export const chartGalleryTooltipClasses = {
  unitRow: "text-muted-foreground flex min-w-[130px] items-center text-xs",
  // shadcn sets the tooltip to 180px, which leaves 158px inside its border and padding.
  swatchRow: "flex w-[158px] flex-wrap items-center gap-2",
  swatch: "size-2.5 shrink-0 rounded-[2px]",
  value: "text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums",
  unit: "text-muted-foreground font-normal",
  total: "text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium",
} as const;

/** Builds a formatted row as DOM nodes. It runs in the browser only, when a tooltip opens. */
function domTooltipRow(row: ChartGalleryTooltipRow): HTMLElement {
  const classes = chartGalleryTooltipClasses;
  const element = (tag: string, className: string, ...children: (Node | string)[]) => {
    const node = document.createElement(tag);
    node.className = className;
    node.append(...children);
    return node;
  };
  const amount = (value: string, unit: string) =>
    element("div", classes.value, value, element("span", classes.unit, unit));
  if (row.kind === "unit") {
    return element("div", classes.unitRow, row.name, amount(row.value, row.unit));
  }
  const swatch = element("div", classes.swatch);
  swatch.style.background = `var(--sw-chart-color-${row.key})`;
  const wrapper = element("div", classes.swatchRow, swatch, row.name, amount(row.value, row.unit));
  if (row.total !== undefined)
    wrapper.append(element("div", classes.total, "Total", amount(row.total, row.unit)));
  return wrapper;
}

export interface ChartGalleryEntry {
  /** The shadcn registry name, for example `chart-area-default`. It is also the chart id. */
  id: string;
  title: string;
  description: string;
  chart: ChartGalleryChart;
  config: ChartConfig;
  data: readonly ChartGalleryRow[];
  footer?: ChartGalleryFooter;
  legend?: boolean;
  /** Spans the full grid row, as shadcn's interactive variants do. */
  fullWidth?: boolean;
  control?: ChartGalleryControl;
  /** Draws a square chart up to this width, as shadcn's pie, radar and radial cards do. */
  square?: number;
  /** `false` shows no tooltip, as shadcn's cards that have no `ChartTooltip` do. */
  tooltip?: false;
  /** Tooltip formatters. The cards pass them to `ChartTooltipContent`. */
  format?: ChartGalleryFormat;
}

/** Lucide `trending-up` as portable icon data, for the card footer and chart config. */
export const trendingUpIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
};

const trendingDownIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: ["M22 17 13.5 8.5 8.5 13.5 2 7", "M16 17h6v-6"],
};

const activityIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: ["M22 12h-4l-3 9L9 3l-3 9H2"],
};

// Data -----------------------------------------------------------------------------------------

const months = ["January", "February", "March", "April", "May", "June"];

function monthRows(fields: Record<string, readonly number[]>): ChartGalleryRow[] {
  return months.map((month, index) => ({
    month,
    ...Object.fromEntries(Object.entries(fields).map(([key, values]) => [key, values[index]!])),
  }));
}

const desktop = [186, 305, 237, 73, 209, 214];
const mobile = [80, 200, 120, 190, 130, 140];
const other = [45, 100, 150, 50, 100, 160];

const desktopRows = monthRows({ desktop });
const visitorRows = monthRows({ desktop, mobile });
const deviceRows = monthRows({ desktop, mobile, other });
const negativeRows = monthRows({ visitors: [186, 205, -207, 173, -209, 214] });

const browsers = ["chrome", "safari", "firefox", "edge", "other"];

function browserRows(visitors: readonly number[]): ChartGalleryRow[] {
  return browsers.map((browser, index) => ({ browser, visitors: visitors[index]! }));
}

const dailyDesktop = [
  222, 97, 167, 242, 373, 301, 245, 409, 59, 261, 327, 292, 342, 137, 120, 138, 446, 364, 243, 89,
  137, 224, 138, 387, 215, 75, 383, 122, 315, 454, 165, 293, 247, 385, 481, 498, 388, 149, 227, 293,
  335, 197, 197, 448, 473, 338, 499, 315, 235, 177, 82, 81, 252, 294, 201, 213, 420, 233, 78, 340,
  178, 178, 470, 103, 439, 88, 294, 323, 385, 438, 155, 92, 492, 81, 426, 307, 371, 475, 107, 341,
  408, 169, 317, 480, 132, 141, 434, 448, 149, 103, 446,
];
const dailyMobile = [
  150, 180, 120, 260, 290, 340, 180, 320, 110, 190, 350, 210, 380, 220, 170, 190, 360, 410, 180,
  150, 200, 170, 230, 290, 250, 130, 420, 180, 240, 380, 220, 310, 190, 420, 390, 520, 300, 210,
  180, 330, 270, 240, 160, 490, 380, 400, 420, 350, 180, 230, 140, 120, 290, 220, 250, 170, 460,
  190, 130, 280, 230, 200, 410, 160, 380, 140, 250, 370, 320, 480, 200, 150, 420, 130, 380, 350,
  310, 520, 170, 290, 450, 210, 270, 530, 180, 190, 380, 490, 200, 160, 400,
];

const DAY = 86_400_000;
const firstDay = Date.UTC(2024, 3, 1);
const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Daily visitors from 2024-04-01 to 2024-06-30. Dates are ISO strings, so they serialize. */
const dailyRows: ChartGalleryRow[] = dailyDesktop.map((value, index) => ({
  date: isoDate(firstDay + index * DAY),
  desktop: value,
  mobile: dailyMobile[index]!,
}));

/** Dates format in UTC, so the server and the browser show the same labels. */
function formatDate(date: string, year = false): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(year ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  });
}

/** Rows on or after the range start, counted back from 2024-06-30, as shadcn filters them. */
export function chartGalleryRangeRows(
  rows: readonly ChartGalleryRow[],
  days: number,
): ChartGalleryRow[] {
  const start = isoDate(Date.UTC(2024, 5, 30) - days * DAY);
  return rows.filter((row) => String(row.date) >= start);
}

/** The rows a card shows for a control value. An active control marks its row with `active: 1`. */
export function chartGalleryRows(entry: ChartGalleryEntry, value?: string): ChartGalleryRow[] {
  const control = entry.control;
  if (control?.kind === "active") {
    const current = value ?? control.initial;
    return entry.data.map((row) => ({ ...row, active: row[control.field] === current ? 1 : 0 }));
  }
  if (control?.kind !== "range") return [...entry.data];
  const option =
    control.options.find((item) => item.value === (value ?? control.initial)) ??
    control.options[0]!;
  return chartGalleryRangeRows(entry.data, option.days);
}

function total(rows: readonly ChartGalleryRow[], key: string): string {
  return rows.reduce((sum, row) => sum + Number(row[key]), 0).toLocaleString("en-US");
}

// Config ---------------------------------------------------------------------------------------

const desktopConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
} satisfies ChartConfig;

const visitorConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const browserConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig;

const lineBrowserConfig = {
  ...browserConfig,
  visitors: { label: "Visitors", color: "var(--chart-2)" },
} satisfies ChartConfig;

// Chart helpers --------------------------------------------------------------------------------

// Mark rows keep every source field, so channels can name any of them.
type Datum = Record<string, any> & { id: string; series: string; value: number; label?: string };
type Context = ChartContext<ChartGalleryRow>;
type Point = readonly [number, number];

/** The chart color of a config key. Every key has this variable, even keys that name a token. */
const color = (key: string) => `var(--sw-chart-color-${key})`;

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
    const a = Array.from<number>({ length: m });
    const b = Array.from<number>({ length: m });
    const r = Array.from<number>({ length: m });
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

/** Monotone cubic interpolation along x, the same shape as d3 curveMonotoneX. */
const monotone = curve((points, move) => {
  const n = points.length;
  if (n === 0) return "";
  let path = start(points, move);
  if (n === 1) return path;
  if (n === 2) return `${path}L${points[1]![0]},${points[1]![1]}`;
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
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const third = (x1 - x0) / 3;
    path += `C${x0 + third},${y0 + third * tangents[i]!},${x1 - third},${y1 - third * tangents[i + 1]!},${x1},${y1}`;
  }
  return path;
});

/** Straight segments. */
const linear = curve(linearPath);

/** Steps at the midpoint between points, the same shape as d3 curveStep. */
const step = curve((points, move) => {
  if (points.length === 0) return "";
  let path = start(points, move);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const middle = (x0 + x1) / 2;
    path += `L${middle},${y0}L${middle},${y1}L${x1},${y1}`;
  }
  return path;
});

/** One row per visible series and x value. Rows keep their x order inside each series. */
function seriesRows(ctx: Context, x: string, keys: readonly string[]): Datum[] {
  return ctx.data.flatMap((row) =>
    keys
      .filter((key) => ctx.isVisible(key))
      .map((series) => ({ ...row, id: `${row[x]}-${series}`, series, value: Number(row[series]) })),
  );
}

/**
 * Stacks the rows in series order at each x value. `bottom` and `top` bound each layer, so the
 * areas, their top lines and the active dots share one stack. `normalize` stacks shares of the
 * total, as Recharts `stackOffset="expand"` does.
 */
function stackRows(
  rows: readonly Datum[],
  x: string,
  normalize = false,
): (Datum & { bottom: number; top: number })[] {
  const totals = new Map<unknown, number>();
  for (const row of rows) totals.set(row[x], (totals.get(row[x]) ?? 0) + row.value);
  const sums = new Map<unknown, number>();
  return rows.map((row) => {
    const bottom = sums.get(row[x]) ?? 0;
    sums.set(row[x], bottom + row.value);
    const scale = normalize ? totals.get(row[x]) || 1 : 1;
    return { ...row, bottom: bottom / scale, top: (bottom + row.value) / scale };
  });
}

const grid = { stroke: "var(--border)", strokeOpacity: 0.5 };
const shortMonth = (value: string) => value.slice(0, 3);

function categoryAxis(format?: (value: string) => string, padding = 8) {
  return { line: false as const, ticks: { size: 0, padding, ...(format ? { format } : {}) } };
}

// Scale instances keep their authored domain order. A scale factory takes its domain from the marks.

/** Months at the plot edges, as Recharts places category points in line and area charts. */
function monthPoints() {
  return { scale: scalePoint<string>().domain(months).padding(0), axis: categoryAxis(shortMonth) };
}

function monthBands(axis: false | ReturnType<typeof categoryAxis> = categoryAxis(shortMonth, 10)) {
  return { scale: scaleBand<string>().domain(months).paddingInner(0.2).paddingOuter(0.1), axis };
}

function browserBands(ctx: Context, axis = true) {
  return {
    scale: scaleBand<string>().domain(browsers).paddingInner(0.2).paddingOuter(0.1),
    axis: axis ? categoryAxis((value) => ctx.label(value), 10) : (false as const),
  };
}

/** A hidden value axis. `gridLines` keeps the horizontal or vertical grid. */
function valueAxis(gridLines = true) {
  return { scale: scaleLinear, nice: true, ...(gridLines ? { grid } : {}), axis: false as const };
}

/** Date axis labels for the interactive charts. About twelve labels fit, as `minTickGap` does. */
function dateAxis(ctx: Context, kind: "band" | "point") {
  const dates = ctx.data.map((row) => String(row.date));
  const every = Math.max(1, Math.ceil(dates.length / 12));
  return {
    scale:
      kind === "band"
        ? scaleBand<string>().domain(dates).paddingInner(0.2).paddingOuter(0.1)
        : scalePoint<string>().domain(dates).padding(0),
    axis: {
      line: false as const,
      ticks: {
        size: 0,
        padding: 8,
        values: dates.filter((_, index) => index % every === 0),
        format: (value: string) => formatDate(value),
      },
    },
  };
}

function interaction(
  ctx: Context,
  fields?: Parameters<Context["tooltip"]>[0],
  focus: "group-x" | "group-y" = "group-x",
) {
  return {
    svgAnimation: false as const,
    focusRing: false as const,
    maxFocusDistance: Infinity,
    focus,
    tooltip: ctx.tooltip(fields),
  };
}

function scene(ctx: Context) {
  return { color: ctx.color, theme: ctx.theme };
}

/** Recharts' default tooltip cursor on bar charts: a muted band behind the category. */
const bandCursor = (axis: "x" | "y" = "x") =>
  crosshair({
    id: "category-cursor",
    [axis]: { band: { fill: "var(--muted)", fillOpacity: 1 } },
    [axis === "x" ? "y" : "x"]: false,
    marker: false,
  } as Parameters<typeof crosshair>[0]);

/** Recharts' default tooltip cursor on line charts: a vertical rule in the border color. */
const lineCursor = () =>
  crosshair({
    id: "line-cursor",
    x: { stroke: "var(--border)", strokeOpacity: 1 },
    y: false,
    marker: false,
  } as Parameters<typeof crosshair>[0]);

/** The dot Recharts draws on the hovered point of each line or area. */
function activeDots(rows: readonly ChartGalleryRow[], x: string, y: string, r = 4) {
  return whenFocused(
    dot(rows, { id: "active-dots", x, y, z: "series", color: "series", key: "id", r }),
    { match: "x" },
  );
}

interface AreaOptions {
  keys: readonly string[];
  curve?: ChartCurve;
  x?: string;
  fill?: (series: string) => string;
  fillOpacity?: (series: string) => number;
  normalize?: boolean;
}

/** Recharts areas: a filled layer, a 1px top line in the series color and active dots. */
function areas(ctx: Context, options: AreaOptions) {
  const x = options.x ?? "month";
  const stacked = stackRows(seriesRows(ctx, x, options.keys), x, options.normalize);
  const layers = [...new Set(stacked.map((row) => row.series))];
  return [
    ...layers.map((series) =>
      areaY(
        stacked.filter((row) => row.series === series),
        {
          id: `area-${series}`,
          x,
          y1: "bottom",
          y2: "top",
          z: "series",
          color: "series",
          key: "id",
          curve: options.curve ?? natural,
          fill: options.fill ? options.fill(series) : color(series),
          fillOpacity: options.fillOpacity?.(series) ?? 0.4,
        },
      ),
    ),
    decorative(
      lineY(stacked, {
        id: "area-lines",
        x,
        y: "top",
        z: "series",
        color: "series",
        key: "id",
        curve: options.curve ?? natural,
        strokeWidth: 1,
      }),
    ),
    activeDots(stacked, x, "top"),
  ];
}

interface LineOptions {
  keys: readonly string[];
  curve?: ChartCurve;
  x?: string;
}

function lines(ctx: Context, options: LineOptions) {
  const x = options.x ?? "month";
  const rows = seriesRows(ctx, x, options.keys);
  return {
    rows,
    marks: [
      lineY(rows, {
        id: "lines",
        x,
        y: "value",
        z: "series",
        color: "series",
        key: "id",
        curve: options.curve ?? natural,
        strokeWidth: 2,
      }),
    ],
  };
}

type Presentation = ChartGalleryChart["presentation"];

function chartModule(
  id: string,
  ariaLabel: string,
  create: (ctx: Context) => unknown,
  options: {
    presentation?: Presentation;
    height?: number;
    aspectRatio?: number;
    format?: ChartGalleryFormat;
  } = {},
): ChartGalleryChart {
  const format = options.format;
  return defineChartModule<ChartGalleryRow, any, any, any>({
    id,
    ariaLabel,
    presentation: options.presentation,
    // Astro takes formatters from `domPresentation`, because functions cannot leave the server.
    ...(format
      ? {
          domPresentation: {
            ...(format.row
              ? {
                  formatter: (value, name, item, index) =>
                    domTooltipRow(format.row!(value, name, item as never, index)),
                }
              : {}),
            ...(format.label ? { labelFormatter: (label) => format.label!(label) } : {}),
          },
        }
      : {}),
    host: options.height
      ? { height: options.height }
      : { aspectRatio: options.aspectRatio ?? 16 / 9 },
    create: create as ChartGalleryChart["create"],
  });
}

const trend = (detail: string): ChartGalleryFooter => ({
  trend: "Trending up by 5.2% this month",
  detail,
});
const sixMonths = "Showing total visitors for the last 6 months";
const halfYear = "January - June 2024";

// Area charts ----------------------------------------------------------------------------------

const rangeControl: ChartGalleryRangeControl = {
  kind: "range",
  label: "Select a value",
  initial: "90d",
  options: [
    { value: "90d", label: "Last 3 months", days: 90 },
    { value: "30d", label: "Last 30 days", days: 30 },
    { value: "7d", label: "Last 7 days", days: 7 },
  ],
};

const gradients = (keys: readonly string[]) =>
  keys.map((key) => ({
    id: `fill-${key}`,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
    stops: [
      { offset: 0.05, color: color(key), opacity: 0.8 },
      { offset: 0.95, color: color(key), opacity: 0.1 },
    ],
  }));

const areaEntries: ChartGalleryEntry[] = [
  {
    id: "chart-area-interactive",
    title: "Area Chart - Interactive",
    description: "Showing total visitors for the last 3 months",
    config: visitorConfig,
    data: dailyRows,
    legend: true,
    fullWidth: true,
    control: rangeControl,
    chart: chartModule(
      "chart-area-interactive",
      "Interactive stacked area chart of daily visitors",
      (ctx) => {
        const rows = ctx.data.map((row) => ({ ...row, label: formatDate(String(row.date)) }));
        const labelled = { ...ctx, data: rows };
        return defineChart(
          {
            marks: areas(labelled, {
              keys: ["mobile", "desktop"],
              x: "date",
              fill: (series) => `url(#fill-${series})`,
              // Recharts areas default to 60% fill opacity on top of the gradient.
              fillOpacity: () => 0.6,
            }),
            scales: { x: dateAxis(ctx, "point"), y: valueAxis() },
            gradients: gradients(["desktop", "mobile"]),
            ...scene(ctx),
          },
          interaction(ctx, { labelKey: "label" }),
        );
      },
      { height: 250, presentation: { indicator: "dot" } },
    ),
  },
  {
    id: "chart-area-default",
    title: "Area Chart",
    description: "Showing total visitors for the last 6 months",
    config: desktopConfig,
    data: desktopRows,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-default",
      "Area chart of desktop visitors",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["desktop"] }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-area-linear",
    title: "Area Chart - Linear",
    description: "Showing total visitors for the last 6 months",
    config: desktopConfig,
    data: desktopRows,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-linear",
      "Linear area chart of desktop visitors",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["desktop"], curve: linear }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "dot", hideLabel: true } },
    ),
  },
  {
    id: "chart-area-step",
    title: "Area Chart - Step",
    description: "Showing total visitors for the last 6 months",
    config: { desktop: { ...desktopConfig.desktop, icon: activityIcon } },
    data: desktopRows,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-step",
      "Step area chart of desktop visitors",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["desktop"], curve: step }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-area-legend",
    title: "Area Chart - Legend",
    description: "Showing total visitors for the last 6 months",
    config: visitorConfig,
    data: visitorRows,
    legend: true,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-legend",
      "Stacked area chart of visitors with a legend",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["mobile", "desktop"] }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-area-stacked",
    title: "Area Chart - Stacked",
    description: "Showing total visitors for the last 6 months",
    config: visitorConfig,
    data: visitorRows,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-stacked",
      "Stacked area chart of visitors",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["mobile", "desktop"] }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "dot" } },
    ),
  },
  {
    id: "chart-area-stacked-expand",
    title: "Area Chart - Stacked Expanded",
    description: "Showing total visitors for the last 6months",
    config: {
      ...visitorConfig,
      other: { label: "Other", color: "var(--chart-3)" },
    },
    data: deviceRows,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-stacked-expand",
      "Stacked area chart of the visitor share by device",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, {
              keys: ["other", "mobile", "desktop"],
              normalize: true,
              fillOpacity: (series) => (series === "other" ? 0.1 : 0.4),
            }),
            scales: {
              x: monthPoints(),
              y: { ...valueAxis(), scale: scaleLinear().domain([0, 1]), nice: false },
            },
            margin: { top: 12 },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-area-icons",
    title: "Area Chart - Icons",
    description: "Showing total visitors for the last 6 months",
    config: {
      desktop: { ...visitorConfig.desktop, icon: trendingDownIcon },
      mobile: { ...visitorConfig.mobile, icon: trendingUpIcon },
    },
    data: visitorRows,
    legend: true,
    footer: trend(halfYear),
    chart: chartModule(
      "chart-area-icons",
      "Stacked area chart of visitors with icons",
      (ctx) =>
        defineChart(
          {
            marks: areas(ctx, { keys: ["mobile", "desktop"] }),
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-area-gradient",
    title: "Area Chart - Gradient",
    description: "Showing total visitors for the last 6 months",
    config: visitorConfig,
    data: visitorRows,
    footer: trend(halfYear),
    chart: chartModule("chart-area-gradient", "Stacked gradient area chart of visitors", (ctx) =>
      defineChart(
        {
          marks: areas(ctx, {
            keys: ["mobile", "desktop"],
            fill: (series) => `url(#fill-${series})`,
          }),
          scales: { x: monthPoints(), y: valueAxis() },
          gradients: gradients(["desktop", "mobile"]),
          ...scene(ctx),
        },
        interaction(ctx),
      ),
    ),
  },
  {
    id: "chart-area-axes",
    title: "Area Chart - Axes",
    description: "Showing total visitors for the last 6 months",
    config: visitorConfig,
    data: visitorRows,
    footer: trend(halfYear),
    chart: chartModule("chart-area-axes", "Stacked area chart of visitors with axes", (ctx) =>
      defineChart(
        {
          marks: areas(ctx, { keys: ["mobile", "desktop"] }),
          scales: {
            x: monthPoints(),
            y: {
              scale: scaleLinear,
              nice: true,
              grid,
              axis: { line: false as const, ticks: { size: 0, padding: 8, count: 3 } },
            },
          },
          ...scene(ctx),
        },
        interaction(ctx),
      ),
    ),
  },
];

// Bar charts -----------------------------------------------------------------------------------

const seriesControl = (config: ChartConfig): ChartGallerySeriesControl => ({
  kind: "series",
  initial: "desktop",
  options: ["desktop", "mobile"].map((key) => ({
    key,
    label: String(config[key]?.label ?? key),
    total: total(dailyRows, key),
  })),
});

const barInteractiveConfig = {
  views: { label: "Page Views" },
  desktop: { label: "Desktop", color: "var(--chart-2)" },
  mobile: { label: "Mobile", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Interactive rows carry a formatted tooltip label and the `views` tooltip name. */
function viewRows(ctx: Context): Datum[] {
  return seriesRows(ctx, "date", ["desktop", "mobile"]).map((row) => ({
    ...row,
    label: formatDate(String(row.date), true),
    name: "views",
  }));
}

/** Recharts names a single-value tooltip row after the value field, for example "Visitors". */
function valueRows(ctx: Context, x: string, field: string): Datum[] {
  return ctx.data.map((row) => ({
    ...row,
    id: String(row[x]),
    series: field,
    value: Number(row[field]),
    name: field,
  }));
}

const barEntries: ChartGalleryEntry[] = [
  {
    id: "chart-bar-interactive",
    title: "Bar Chart - Interactive",
    description: "Showing total visitors for the last 3 months",
    config: barInteractiveConfig,
    data: dailyRows,
    fullWidth: true,
    control: seriesControl(barInteractiveConfig),
    chart: chartModule(
      "chart-bar-interactive",
      "Interactive bar chart of daily page views",
      (ctx) =>
        defineChart(
          {
            marks: [
              bandCursor(),
              barY(viewRows(ctx), {
                id: "bars",
                x: "date",
                y: "value",
                color: "series",
                key: "id",
              }),
            ],
            scales: { x: dateAxis(ctx, "band"), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx, { labelKey: "label", nameKey: "name" }),
        ),
      { height: 250 },
    ),
  },
  {
    id: "chart-bar-default",
    title: "Bar Chart",
    description: halfYear,
    config: desktopConfig,
    data: desktopRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-default",
      "Bar chart of desktop visitors",
      (ctx) =>
        defineChart(
          {
            marks: [
              barY(seriesRows(ctx, "month", ["desktop"]), {
                id: "bars",
                x: "month",
                y: "value",
                color: "series",
                key: "id",
                radius: 8,
              }),
            ],
            scales: { x: monthBands(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-horizontal",
    title: "Bar Chart - Horizontal",
    description: halfYear,
    config: desktopConfig,
    data: desktopRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-horizontal",
      "Horizontal bar chart of desktop visitors",
      (ctx) =>
        defineChart(
          {
            marks: [
              barX(seriesRows(ctx, "month", ["desktop"]), {
                id: "bars",
                x: "value",
                y: "month",
                color: "series",
                key: "id",
                radius: 5,
              }),
            ],
            scales: { x: valueAxis(false), y: monthBands() },
            ...scene(ctx),
          },
          interaction(ctx, undefined, "group-y"),
        ),
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-multiple",
    title: "Bar Chart - Multiple",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-multiple",
      "Grouped bar chart of desktop and mobile visitors",
      (ctx) =>
        defineChart(
          {
            marks: [
              barY(seriesRows(ctx, "month", ["desktop", "mobile"]), {
                id: "bars",
                x: "month",
                y: "value",
                z: "series",
                color: "series",
                key: "id",
                layout: group({ padding: 0.1 }),
                radius: 4,
              }),
            ],
            scales: { x: monthBands(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { indicator: "dashed" } },
    ),
  },
  {
    id: "chart-bar-stacked",
    title: "Bar Chart - Stacked + Legend",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    legend: true,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-stacked",
      "Stacked bar chart of desktop and mobile visitors",
      (ctx) =>
        defineChart(
          {
            marks: [
              bandCursor(),
              barY(seriesRows(ctx, "month", ["desktop", "mobile"]), {
                id: "bars",
                x: "month",
                y: "value",
                z: "series",
                color: "series",
                key: "id",
                radius: (row: Datum) =>
                  row.series === "desktop" ? [0, 0, 4, 4] : ([4, 4, 0, 0] as const),
              }),
            ],
            scales: { x: monthBands(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        ),
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-label",
    title: "Bar Chart - Label",
    description: halfYear,
    config: desktopConfig,
    data: desktopRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-label",
      "Bar chart of desktop visitors with value labels",
      (ctx) => {
        const rows = seriesRows(ctx, "month", ["desktop"]);
        return defineChart(
          {
            marks: [
              barY(rows, {
                id: "bars",
                x: "month",
                y: "value",
                color: "series",
                key: "id",
                radius: 8,
              }),
              decorative(
                text(rows, {
                  id: "labels",
                  x: "month",
                  y: "value",
                  text: "value",
                  dy: -18,
                  fontSize: 12,
                  fill: "var(--foreground)",
                }),
              ),
            ],
            scales: { x: monthBands(), y: valueAxis() },
            margin: { top: 20 },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-label-custom",
    title: "Bar Chart - Custom Label",
    description: halfYear,
    config: {
      desktop: { label: "Desktop", color: "var(--chart-2)" },
      mobile: { label: "Mobile", color: "var(--chart-2)" },
      label: { color: "var(--background)" },
    },
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-label-custom",
      "Horizontal bar chart of desktop visitors with labels inside the bars",
      (ctx) => {
        const rows = seriesRows(ctx, "month", ["desktop"]);
        return defineChart(
          {
            marks: [
              barX(rows, {
                id: "bars",
                x: "value",
                y: "month",
                color: "series",
                key: "id",
                radius: 4,
              }),
              decorative(
                text(rows, {
                  id: "month-labels",
                  x: () => 0,
                  y: "month",
                  text: "month",
                  anchor: "start",
                  dx: 8,
                  fontSize: 12,
                  fill: color("label"),
                }),
              ),
              decorative(
                text(rows, {
                  id: "value-labels",
                  x: "value",
                  y: "month",
                  text: "value",
                  anchor: "start",
                  dx: 8,
                  fontSize: 12,
                  fill: "var(--foreground)",
                }),
              ),
            ],
            scales: { x: valueAxis(), y: monthBands(false) },
            margin: { right: 16 },
            ...scene(ctx),
          },
          interaction(ctx, undefined, "group-y"),
        );
      },
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-bar-mixed",
    title: "Bar Chart - Mixed",
    description: halfYear,
    config: browserConfig,
    data: browserRows([275, 200, 187, 173, 90]),
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-mixed",
      "Horizontal bar chart of visitors by browser",
      (ctx) =>
        defineChart(
          {
            marks: [
              barX(valueRows(ctx, "browser", "visitors"), {
                id: "bars",
                x: "value",
                y: "browser",
                color: "browser",
                key: "id",
                radius: 5,
              }),
            ],
            scales: { x: valueAxis(false), y: browserBands(ctx) },
            ...scene(ctx),
          },
          interaction(ctx, { nameKey: "name" }, "group-y"),
        ),
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-active",
    title: "Bar Chart - Active",
    description: halfYear,
    config: browserConfig,
    data: browserRows([187, 200, 275, 173, 90]),
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-active",
      "Bar chart of visitors by browser with Firefox marked",
      (ctx) => {
        const rows = valueRows(ctx, "browser", "visitors");
        const active = (row: Datum) => row.browser === "firefox";
        return defineChart(
          {
            marks: [
              barY(rows, {
                id: "bars",
                x: "browser",
                y: "value",
                color: "browser",
                key: "id",
                radius: 8,
                // shadcn draws the active bar at 80% opacity with a dashed outline.
                fill: (row: Datum) =>
                  active(row)
                    ? `color-mix(in oklab, ${color(String(row.browser))} 80%, transparent)`
                    : color(String(row.browser)),
                stroke: (row: Datum) => (active(row) ? color(String(row.browser)) : "none"),
                strokeWidth: 2,
                strokeDasharray: (row: Datum) => (active(row) ? "4" : "none"),
              }),
            ],
            scales: { x: browserBands(ctx), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx, { nameKey: "name" }),
        );
      },
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-bar-negative",
    title: "Bar Chart - Negative",
    description: halfYear,
    config: { visitors: { label: "Visitors" } },
    data: negativeRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-bar-negative",
      "Bar chart of visitor change with negative months",
      (ctx) => {
        const rows = valueRows(ctx, "month", "visitors");
        return defineChart(
          {
            marks: [
              barY(rows, {
                id: "bars",
                x: "month",
                y: "value",
                key: "id",
                fill: (row: Datum) => (row.value > 0 ? "var(--chart-1)" : "var(--chart-2)"),
              }),
              decorative(
                text(rows, {
                  id: "labels",
                  x: "month",
                  y: "value",
                  text: "month",
                  dy: (row: Datum) => (row.value > 0 ? -11 : 11),
                  fill: "var(--foreground)",
                }),
              ),
            ],
            scales: { x: monthBands(false), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx, { nameKey: "name" }),
        );
      },
      { presentation: { hideLabel: true, hideIndicator: true } },
    ),
  },
];

// Line charts ----------------------------------------------------------------------------------

const lineInteractiveConfig = {
  views: { label: "Page Views" },
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

function simpleLine(id: string, title: string, ariaLabel: string, lineCurve: ChartCurve) {
  return {
    id,
    title,
    description: halfYear,
    config: desktopConfig,
    data: desktopRows,
    footer: trend(sixMonths),
    chart: chartModule(
      id,
      ariaLabel,
      (ctx) => {
        const { rows, marks } = lines(ctx, { keys: ["desktop"], curve: lineCurve });
        return defineChart(
          {
            marks: [...marks, activeDots(rows, "month", "value")],
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
      { presentation: { hideLabel: true } },
    ),
  } satisfies ChartGalleryEntry;
}

/** Points on a line, as Recharts `dot` draws them: radius 3 with a 2px ring in the line color. */
function lineDots(rows: readonly Datum[], paint: string, x = "month") {
  return decorative(
    dot(rows, {
      id: "dots",
      x,
      y: "value",
      key: "id",
      r: 3,
      fill: paint,
      stroke: paint,
      strokeWidth: 2,
    }),
  );
}

function browserLine(ctx: Context) {
  const rows = valueRows(ctx, "browser", "visitors");
  return {
    rows,
    line: lineY(rows, {
      id: "lines",
      x: "browser",
      y: "value",
      key: "id",
      curve: natural,
      stroke: color("visitors"),
      strokeWidth: 2,
    }),
  };
}

function browserPoints() {
  return { scale: scalePoint<string>().domain(browsers).padding(0), axis: false as const };
}

const lineEntries: ChartGalleryEntry[] = [
  {
    id: "chart-line-interactive",
    title: "Line Chart - Interactive",
    description: "Showing total visitors for the last 3 months",
    config: lineInteractiveConfig,
    data: dailyRows,
    fullWidth: true,
    control: seriesControl(lineInteractiveConfig),
    chart: chartModule(
      "chart-line-interactive",
      "Interactive line chart of daily page views",
      (ctx) => {
        const rows = viewRows(ctx);
        return defineChart(
          {
            marks: [
              lineCursor(),
              lineY(rows, {
                id: "lines",
                x: "date",
                y: "value",
                z: "series",
                color: "series",
                key: "id",
                curve: monotone,
                strokeWidth: 2,
              }),
              activeDots(rows, "date", "value"),
            ],
            scales: { x: dateAxis(ctx, "point"), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx, { labelKey: "label", nameKey: "name" }),
        );
      },
      { height: 250 },
    ),
  },
  simpleLine("chart-line-default", "Line Chart", "Line chart of desktop visitors", natural),
  simpleLine(
    "chart-line-linear",
    "Line Chart - Linear",
    "Linear line chart of desktop visitors",
    linear,
  ),
  simpleLine("chart-line-step", "Line Chart - Step", "Step line chart of desktop visitors", step),
  {
    id: "chart-line-multiple",
    title: "Line Chart - Multiple",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-multiple",
      "Line chart of desktop and mobile visitors",
      (ctx) => {
        const { rows, marks } = lines(ctx, { keys: ["desktop", "mobile"], curve: monotone });
        return defineChart(
          {
            marks: [...marks, activeDots(rows, "month", "value")],
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
    ),
  },
  {
    id: "chart-line-dots",
    title: "Line Chart - Dots",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-dots",
      "Line chart of desktop visitors with dots",
      (ctx) => {
        const { rows, marks } = lines(ctx, { keys: ["desktop"] });
        return defineChart(
          {
            marks: [
              ...marks,
              lineDots(rows, color("desktop")),
              activeDots(rows, "month", "value", 6),
            ],
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-line-dots-custom",
    title: "Line Chart - Custom Dots",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-dots-custom",
      "Line chart of desktop visitors with commit icons as dots",
      (ctx) => {
        const { rows, marks } = lines(ctx, { keys: ["desktop"] });
        // Lucide `git-commit-vertical` at 24px: a 3px ring on a vertical stroke with a gap.
        return defineChart(
          {
            marks: [
              ...marks,
              decorative(
                tickX(rows, {
                  id: "commit-stems",
                  x: "month",
                  y: "value",
                  key: "id",
                  length: 18,
                  strokeWidth: 2,
                  stroke: color("desktop"),
                }),
              ),
              decorative(
                dot(rows, {
                  id: "commit-rings",
                  x: "month",
                  y: "value",
                  key: "id",
                  r: 3,
                  fill: "var(--background)",
                  stroke: color("desktop"),
                  strokeWidth: 2,
                }),
              ),
              activeDots(rows, "month", "value"),
            ],
            scales: { x: monthPoints(), y: valueAxis() },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
      { presentation: { hideLabel: true } },
    ),
  },
  {
    id: "chart-line-dots-colors",
    title: "Line Chart - Dots Colors",
    description: halfYear,
    config: lineBrowserConfig,
    data: browserRows([275, 200, 187, 173, 90]),
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-dots-colors",
      "Line chart of visitors by browser with a colored dot for each browser",
      (ctx) => {
        const { rows, line } = browserLine(ctx);
        return defineChart(
          {
            marks: [
              line,
              decorative(
                dot(rows, {
                  id: "dots",
                  x: "browser",
                  y: "value",
                  key: "id",
                  color: "browser",
                  r: 5,
                }),
              ),
              activeDots(rows, "browser", "value"),
            ],
            scales: { x: browserPoints(), y: valueAxis() },
            margin: { top: 24, left: 24, right: 24 },
            ...scene(ctx),
          },
          interaction(ctx, { nameKey: "name" }),
        );
      },
      { presentation: { indicator: "line", hideLabel: true } },
    ),
  },
  {
    id: "chart-line-label",
    title: "Line Chart - Label",
    description: halfYear,
    config: visitorConfig,
    data: visitorRows,
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-label",
      "Line chart of desktop visitors with value labels",
      (ctx) => {
        const { rows, marks } = lines(ctx, { keys: ["desktop"] });
        return defineChart(
          {
            marks: [
              ...marks,
              lineDots(rows, color("desktop")),
              activeDots(rows, "month", "value", 6),
              decorative(
                text(rows, {
                  id: "labels",
                  x: "month",
                  y: "value",
                  text: "value",
                  dy: -18,
                  fontSize: 12,
                  fill: "var(--foreground)",
                }),
              ),
            ],
            scales: { x: monthPoints(), y: valueAxis() },
            margin: { top: 20 },
            ...scene(ctx),
          },
          interaction(ctx),
        );
      },
      { presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-line-label-custom",
    title: "Line Chart - Custom Label",
    description: halfYear,
    config: lineBrowserConfig,
    data: browserRows([275, 200, 187, 173, 90]),
    footer: trend(sixMonths),
    chart: chartModule(
      "chart-line-label-custom",
      "Line chart of visitors by browser with browser names as labels",
      (ctx) => {
        const { rows, line } = browserLine(ctx);
        return defineChart(
          {
            marks: [
              line,
              lineDots(rows, color("visitors"), "browser"),
              activeDots(rows, "browser", "value", 6),
              decorative(
                text(rows, {
                  id: "labels",
                  x: "browser",
                  y: "value",
                  text: (row: Datum) => ctx.label(String(row.browser)),
                  dy: -18,
                  fontSize: 12,
                  fill: "var(--foreground)",
                }),
              ),
            ],
            scales: { x: browserPoints(), y: valueAxis() },
            margin: { top: 24, left: 24, right: 24 },
            ...scene(ctx),
          },
          interaction(ctx, { nameKey: "name" }),
        );
      },
      { presentation: { indicator: "line", hideLabel: true } },
    ),
  },
];

// Polar helpers --------------------------------------------------------------------------------

type Length = (layout: PolarLayoutContext) => number;

/** Recharts angles run counterclockwise in degrees from 3 o'clock. TanStack runs clockwise from 12. */
const rechartsAngle = (degrees: number) => Math.PI / 2 - (degrees * Math.PI) / 180;

/** The upper bound Recharts picks for a radius axis from zero with its five default ticks. */
function niceMax(max: number): number {
  const rough = max / 4;
  const digits = Math.floor(Math.log10(rough)) + 1;
  const unit = 10 ** digits;
  const scale = digits === 1 ? 0.1 : 0.05;
  const step = Math.ceil(Number((rough / unit / scale).toFixed(6))) * scale * unit;
  return Math.ceil(Number((max / step).toFixed(6))) * step;
}

/** A length in pixels on a chart of `size` pixels, which scales with the chart. Recharts sizes in pixels. */
const px =
  (pixels: number, size = 250): Length =>
  (layout) =>
    (layout.radius * pixels * 2) / size;

/** Center text: a large value and a muted caption below it, as shadcn's `<Label>` content. */
function centerText(lines: { value: string; size: number; dy?: number; caption?: string }) {
  const scales = {
    angle: { scale: scaleLinear().domain([0, 1]) },
    radius: { scale: scaleLinear().domain([0, 1]) },
  };
  const at = { angle: 0, radius: 0, baseline: "middle" as const, anchor: "middle" as const };
  return decorative(
    polar({
      scales,
      marks: [
        radialText([{ text: lines.value }], {
          ...at,
          id: "center-value",
          text: "text",
          dy: lines.dy ?? 0,
          fontSize: lines.size,
          fontWeight: 700,
          fill: "var(--foreground)",
        }),
        radialText([{ text: lines.caption ?? "Visitors" }], {
          ...at,
          id: "center-caption",
          text: "text",
          dy: (lines.dy ?? 0) + 24,
          fontSize: 12,
          fill: "var(--muted-foreground)",
        }),
      ],
    }),
  );
}

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

function polarInteraction(
  ctx: Context,
  fields?: Parameters<Context["tooltip"]>[0],
  focus?: typeof focusGroupAngle | ReturnType<typeof focusRadialBand>,
  native?: Parameters<Context["tooltip"]>[1],
) {
  return {
    svgAnimation: false as const,
    focusRing: false as const,
    maxFocusDistance: 48,
    ...(focus ? { focus } : {}),
    tooltip: ctx.tooltip(fields, native),
  };
}

const polarScene = (ctx: Context) => ({ scales: { x: null, y: null }, ...scene(ctx) });

// Pie charts -----------------------------------------------------------------------------------

const browserPieConfig = browserConfig;
const pieLegendConfig = Object.fromEntries(
  Object.entries(browserConfig).filter(([key]) => key !== "visitors"),
) satisfies ChartConfig;

const pieMonths = ["january", "february", "march", "april", "may"];

const pieMonthConfig = {
  visitors: { label: "Visitors" },
  desktop: { label: "Desktop" },
  mobile: { label: "Mobile" },
  january: { label: "January", color: "var(--chart-1)" },
  february: { label: "February", color: "var(--chart-2)" },
  march: { label: "March", color: "var(--chart-3)" },
  april: { label: "April", color: "var(--chart-4)" },
  may: { label: "May", color: "var(--chart-5)" },
} satisfies ChartConfig;

const pieMonthRows: ChartGalleryRow[] = pieMonths.map((month, index) => ({
  month,
  desktop: [186, 305, 237, 173, 209][index]!,
  mobile: [80, 200, 120, 190, 130][index]!,
}));

/**
 * Pie rows, one per visible slice. `series` names the config key of the slice color and tooltip
 * row. `metric` names the value field, for a tooltip row named "Visitors" (`nameKey: "metric"`).
 */
function sliceRows(ctx: Context, name: string, field: string, ring = field): Datum[] {
  return ctx.data
    .filter((row) => ctx.isVisible(String(row[name])))
    .map((row) => ({
      ...row,
      id: `${ring}-${row[name]}`,
      series: String(row[name]),
      value: Number(row[field]),
      metric: "visitors",
      ring,
    }));
}

/** Recharts pies start at 3 o'clock and run counterclockwise. */
function slices(rows: readonly Datum[]): Datum[] {
  return pie(rows, {
    value: "value",
    startAngle: rechartsAngle(0),
    endAngle: rechartsAngle(360),
  }) as unknown as Datum[];
}

interface PieSpec {
  rows: readonly Datum[];
  /** Inner radius in pixels on a 250px chart. */
  inner?: number;
  /** Outer radius. Recharts' default is 80% of half the chart size. */
  outer?: Length;
  /** The active slice reaches 10px past the outer radius, as Recharts' active sector does. */
  active?: (row: Datum) => boolean;
  /** Draws a second ring around the active slice, as shadcn's interactive pie does. */
  ring?: boolean;
  labels?: "line" | "value" | "inside";
  /** The chart size that the pixel radii assume. */
  size?: number;
}

const pieOuter: Length = (layout) => layout.radius * 0.8;

/** The marks of one pie or donut, with Recharts' default sizes. */
function pieMarks(spec: PieSpec) {
  const arcs = slices(spec.rows);
  const outer = spec.outer ?? pieOuter;
  const size = spec.size ?? 250;
  const inner = spec.inner ? px(spec.inner, size) : 0;
  const active = spec.active ?? (() => false);
  const arc = (id: string, rows: Datum[], outerRadius: Length, innerRadius: Length | 0 = inner) =>
    radialArc(rows, { id, key: "id", color: "series", innerRadius, outerRadius });
  // Polar containers and decorative wrappers have different mark types, so the list is loose.
  const marks: any[] = [
    polar({
      scales: { angle: null, radius: null },
      marks: [
        arc(
          "slices",
          arcs.filter((row) => !active(row)),
          outer,
        ),
        arc("active-slice", arcs.filter(active), (layout) => outer(layout) + px(10, size)(layout)),
      ],
    }),
  ];
  if (spec.ring) {
    marks.push(
      decorative(
        polar({
          scales: { angle: null, radius: null },
          marks: [
            arc(
              "active-ring",
              arcs.filter(active),
              (layout) => outer(layout) + px(25, size)(layout),
              (layout) => outer(layout) + px(12, size)(layout),
            ),
          ],
        }),
      ),
    );
  }
  if (spec.labels) marks.push(pieLabels(arcs, spec.labels));
  return marks;
}

/**
 * Slice labels. `line` and `value` sit 20px past the slice, as Recharts' default pie label, and
 * `line` draws Recharts' label line. `inside` sits in the middle of the slice, as `<LabelList>`.
 */
function pieLabels(arcs: readonly Datum[], kind: "line" | "value" | "inside") {
  // Radius 1 is the pie's outer edge, at 80% of the polar radius.
  const scales = {
    angle: { scale: scaleLinear().domain([0, 2 * Math.PI]) },
    radius: { scale: scaleLinear().domain([0, 1]), range: [0, pieOuter] as const },
  };
  if (kind === "inside") {
    return decorative(
      polar({
        scales,
        marks: [
          radialText(arcs, {
            id: "labels",
            key: "id",
            angle: "angle",
            radius: 0.5,
            text: "label",
            anchor: "middle",
            baseline: "middle",
            fontSize: 12,
            fill: "var(--background)",
          }),
        ],
      }),
    );
  }
  return decorative(
    polar({
      scales,
      marks: [
        ...(kind === "line"
          ? [
              radialRule(arcs, {
                id: "label-lines",
                key: "id",
                angle: "angle",
                radius1: 1,
                radius2: 1,
                radius2Offset: 20,
                stroke: (row: Datum) => color(String(row.series)),
              }),
            ]
          : []),
        radialText(arcs, {
          id: "labels",
          key: "id",
          angle: "angle",
          radius: 1,
          radiusOffset: 22,
          text: "value",
          anchor: "outside",
          baseline: "middle",
          fontSize: 12,
          fill: "var(--foreground)",
        }),
      ],
    }),
  );
}

const pieFooter = trend(sixMonths);

function pieEntry(
  id: string,
  title: string,
  ariaLabel: string,
  spec: (ctx: Context) => PieSpec,
  options: {
    config?: ChartConfig;
    data?: readonly ChartGalleryRow[];
    fields?: Parameters<Context["tooltip"]>[0];
    presentation?: Presentation;
    /** More marks after the pie, such as center text. */
    extra?: (ctx: Context) => unknown[];
  } = {},
): ChartGalleryEntry {
  return {
    id,
    title,
    description: halfYear,
    config: options.config ?? browserPieConfig,
    data: options.data ?? browserRows([275, 200, 187, 173, 90]),
    footer: pieFooter,
    square: 250,
    chart: chartModule(
      id,
      ariaLabel,
      (ctx) =>
        defineChart(
          { marks: [...pieMarks(spec(ctx)), ...(options.extra?.(ctx) ?? [])], ...polarScene(ctx) },
          polarInteraction(ctx, options.fields),
        ),
      { aspectRatio: 1, presentation: options.presentation ?? { hideLabel: true } },
    ),
  };
}

const browserSlices = (ctx: Context) =>
  sliceRows(ctx, "browser", "visitors").map((row) => ({
    ...row,
    label: ctx.label(String(row.series)),
  }));

const pieEntries: ChartGalleryEntry[] = [
  pieEntry("chart-pie-simple", "Pie Chart", "Pie chart of visitors by browser", (ctx) => ({
    rows: browserSlices(ctx),
  })),
  pieEntry(
    "chart-pie-separator-none",
    "Pie Chart - Separator None",
    "Pie chart of visitors by browser with no slice separators",
    (ctx) => ({ rows: browserSlices(ctx) }),
  ),
  pieEntry(
    "chart-pie-label",
    "Pie Chart - Label",
    "Pie chart of visitors by browser with value labels",
    (ctx) => ({ rows: browserSlices(ctx), labels: "line" }),
  ),
  pieEntry(
    "chart-pie-label-custom",
    "Pie Chart - Custom Label",
    "Pie chart of visitors by browser with value labels and no label lines",
    (ctx) => ({ rows: browserSlices(ctx), labels: "value" }),
    { fields: { nameKey: "metric" } },
  ),
  pieEntry(
    "chart-pie-label-list",
    "Pie Chart - Label List",
    "Pie chart of visitors by browser with browser names inside the slices",
    (ctx) => ({ rows: browserSlices(ctx), labels: "inside" }),
    { fields: { nameKey: "metric" } },
  ),
  {
    ...pieEntry(
      "chart-pie-legend",
      "Pie Chart - Legend",
      "Pie chart of visitors by browser with a legend",
      (ctx) => ({ rows: browserSlices(ctx) }),
      { config: pieLegendConfig },
    ),
    footer: undefined,
    legend: true,
    square: 300,
    tooltip: false,
  },
  pieEntry("chart-pie-donut", "Pie Chart - Donut", "Donut chart of visitors by browser", (ctx) => ({
    rows: browserSlices(ctx),
    inner: 60,
  })),
  pieEntry(
    "chart-pie-donut-active",
    "Pie Chart - Donut Active",
    "Donut chart of visitors by browser with the Chrome slice raised",
    (ctx) => ({ rows: browserSlices(ctx), inner: 60, active: (row) => row.series === "chrome" }),
  ),
  pieEntry(
    "chart-pie-donut-text",
    "Pie Chart - Donut with Text",
    "Donut chart of visitors by browser with the total in the center",
    (ctx) => ({ rows: browserSlices(ctx), inner: 60 }),
    {
      data: browserRows([275, 200, 287, 173, 190]),
      extra: (ctx) => [centerText({ value: total(ctx.data, "visitors"), size: 30 })],
    },
  ),
  {
    id: "chart-pie-stacked",
    title: "Pie Chart - Stacked",
    description: halfYear,
    config: pieMonthConfig,
    data: pieMonthRows,
    footer: pieFooter,
    square: 250,
    chart: chartModule(
      "chart-pie-stacked",
      "Pie chart of desktop visitors by month inside a ring of mobile visitors by month",
      (ctx) =>
        defineChart(
          {
            marks: [
              polar({
                scales: { angle: null, radius: null },
                marks: [
                  radialArc(slices(sliceRows(ctx, "month", "desktop")), {
                    id: "desktop-slices",
                    key: "id",
                    color: "series",
                    outerRadius: px(60),
                  }),
                  radialArc(slices(sliceRows(ctx, "month", "mobile")), {
                    id: "mobile-slices",
                    key: "id",
                    color: "series",
                    innerRadius: px(70),
                    outerRadius: px(90),
                  }),
                ],
              }),
            ],
            ...polarScene(ctx),
          },
          // The heading names the ring's config key, so it shows "Desktop" or "Mobile".
          polarInteraction(ctx, { labelKey: "ring", nameKey: "month" }),
        ),
      { aspectRatio: 1, presentation: { indicator: "line" } },
    ),
  },
  {
    id: "chart-pie-interactive",
    title: "Pie Chart - Interactive",
    description: halfYear,
    config: pieMonthConfig,
    data: pieMonthRows,
    square: 300,
    control: {
      kind: "active",
      label: "Select a value",
      field: "month",
      initial: "january",
      options: pieMonths.map((month) => ({
        value: month,
        label: pieMonthConfig[month as keyof typeof pieMonthConfig].label,
      })),
    },
    chart: chartModule(
      "chart-pie-interactive",
      "Interactive donut chart of desktop visitors by month",
      (ctx) => {
        const rows = sliceRows(ctx, "month", "desktop");
        const current = rows.find((row) => row.active === 1) ?? rows[0];
        return defineChart(
          {
            marks: [
              ...pieMarks({
                rows,
                inner: 60,
                size: 300,
                active: (row) => row.id === current?.id,
                ring: true,
              }),
              centerText({ value: Number(current?.value ?? 0).toLocaleString("en-US"), size: 30 }),
            ],
            ...polarScene(ctx),
          },
          polarInteraction(ctx, { nameKey: "month" }),
        );
      },
      { aspectRatio: 1, presentation: { hideLabel: true } },
    ),
  },
];

// Radial charts --------------------------------------------------------------------------------

interface RadialSpec {
  rows: readonly Datum[];
  /** Recharts start and end angles in degrees. */
  start?: number;
  end?: number;
  /** Inner and outer radius in pixels on a 250px chart. */
  inner: number;
  outer: number;
  /** Draws the muted track behind each bar, as Recharts' `background`. */
  background?: boolean;
  cornerRadius?: number;
  /** Bars stack in row order, as Recharts' `stackId`. */
  stacked?: boolean;
  guides?: readonly PolarGuide[];
}

/** Recharts radial bars: one band per row from the inner radius out, sized like `barCategoryGap`. */
function radialBars(spec: RadialSpec) {
  const bands = [...new Set(spec.rows.map((row) => String(row.band)))];
  const stacked: Datum[] = spec.stacked
    ? stackRows(spec.rows, "band")
    : spec.rows.map((row) => ({ ...row, bottom: 0, top: row.value }));
  // Recharts' implicit angle axis has no tick count, so its domain ends at the largest value.
  const max = Math.max(...stacked.map((row) => row.top), 1);
  const band = scaleBand<string>().domain(bands).paddingInner(0.2).paddingOuter(0.1);
  const scales = {
    angle: { scale: scaleLinear().domain([0, max]) },
    radius: { scale: band, range: [px(spec.inner), px(spec.outer)] as const },
  };
  const frame = {
    startAngle: rechartsAngle(spec.start ?? 0),
    endAngle: rechartsAngle(spec.end ?? 360),
    scales,
  };
  const focus = focusRadialBand({
    inner: spec.inner,
    outer: spec.outer,
    startAngle: frame.startAngle,
    endAngle: frame.endAngle,
    max,
    band: band.copy().range([spec.inner, spec.outer]),
    mark: "bars",
  });
  // Polar containers and decorative wrappers have different mark types, so the list is loose.
  const marks: any[] = [];
  if (spec.background) {
    marks.push(
      decorative(
        polar({
          ...frame,
          marks: [
            radialBarAngle(spec.rows, {
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
    );
  }
  marks.push(
    polar({
      ...frame,
      ...(spec.guides ? { guides: spec.guides } : {}),
      marks: [
        radialBarAngle(stacked, {
          id: "bars",
          key: "id",
          angle1: "bottom",
          angle2: "top",
          radius: "band",
          color: "series",
          ...(spec.cornerRadius ? { cornerRadius: spec.cornerRadius } : {}),
        }),
      ],
    }),
  );
  return { marks, frame, max, focus };
}

/** Browser rows for radial bars: one band per browser. */
const browserBars = (ctx: Context): Datum[] =>
  sliceRows(ctx, "browser", "visitors").map((row) => ({ ...row, band: row.series }));

/** shadcn's grid disc pair: a muted disc under a background disc, which leaves a muted ring. */
function gridRing(outer: number, inner: number) {
  const disc = (id: string, radius: number, fill: string) =>
    radialArc([{ id, startAngle: 0, endAngle: 2 * Math.PI }], {
      id,
      key: "id",
      startAngle: "startAngle",
      endAngle: "endAngle",
      outerRadius: px(radius),
      fill,
    });
  return decorative(
    polar({
      scales: { angle: null, radius: null },
      marks: [
        disc("grid-outer", outer, "var(--muted)"),
        disc("grid-inner", inner, "var(--background)"),
      ],
    }),
  );
}

function radialEntry(
  id: string,
  title: string,
  ariaLabel: string,
  create: (ctx: Context) => unknown,
  options: {
    config?: ChartConfig;
    data?: readonly ChartGalleryRow[];
    presentation?: Presentation;
    tooltip?: false;
  } = {},
): ChartGalleryEntry {
  return {
    id,
    title,
    description: halfYear,
    config: options.config ?? browserConfig,
    data: options.data ?? browserRows([275, 200, 187, 173, 90]),
    footer: trend(sixMonths),
    square: 250,
    ...(options.tooltip === false ? { tooltip: false as const } : {}),
    chart: chartModule(id, ariaLabel, create, {
      aspectRatio: 1,
      presentation: options.presentation ?? { hideLabel: true },
    }),
  };
}

const safariRow = (visitors: number) => [{ browser: "safari", visitors }];
const safariConfig = {
  visitors: { label: "Visitors" },
  safari: { label: "Safari", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Rotates a label along the arc, reading counterclockwise, as Recharts' radial `insideStart`. */
function arcLabelRows(rows: readonly Datum[], ctx: Context, spec: RadialSpec) {
  const bands = rows.length;
  const band = (spec.outer - spec.inner) / bands;
  const start = rechartsAngle(spec.start ?? 0);
  return rows.map((row, index) => {
    const radius = spec.inner + band * (index + 0.5);
    const text = ctx.label(String(row.series));
    // About 6px per character at 11px, so the label's middle sits half its length into the bar.
    const angle = start - (text.length * 3 + 6) / radius;
    return {
      ...row,
      text,
      r: radius,
      at: angle,
      rotate: (Math.atan2(-Math.sin(angle), -Math.cos(angle)) * 180) / Math.PI,
    };
  });
}

const radialEntries: ChartGalleryEntry[] = [
  radialEntry(
    "chart-radial-simple",
    "Radial Chart",
    "Radial bar chart of visitors by browser",
    (ctx) => {
      const { marks, focus } = radialBars({
        rows: browserBars(ctx),
        inner: 30,
        outer: 110,
        background: true,
      });
      return defineChart(
        { marks, ...polarScene(ctx) },
        polarInteraction(ctx, { nameKey: "series" }, focus),
      );
    },
  ),
  radialEntry(
    "chart-radial-label",
    "Radial Chart - Label",
    "Radial bar chart of visitors by browser with browser names on the bars",
    (ctx) => {
      const spec: RadialSpec = {
        rows: browserBars(ctx),
        start: -90,
        end: 380,
        inner: 30,
        outer: 110,
        background: true,
      };
      const { marks, focus } = radialBars(spec);
      const labels = arcLabelRows(spec.rows, ctx, spec);
      return defineChart(
        {
          marks: [
            ...marks,
            decorative(
              polar({
                scales: {
                  angle: { scale: scaleLinear().domain([0, 2 * Math.PI]) },
                  radius: { scale: scaleLinear().domain([0, 125]), range: [0, px(125)] },
                },
                marks: [
                  radialText(labels, {
                    id: "labels",
                    key: "id",
                    angle: "at",
                    radius: "r",
                    text: "text",
                    rotate: (row) => row.rotate,
                    anchor: "middle",
                    baseline: "middle",
                    fontSize: 11,
                    fill: "white",
                  }),
                ],
              }),
            ),
          ],
          ...polarScene(ctx),
        },
        polarInteraction(ctx, undefined, focus),
      );
    },
  ),
  radialEntry(
    "chart-radial-grid",
    "Radial Chart - Grid",
    "Radial bar chart of visitors by browser on a circular grid",
    (ctx) => {
      const { marks, frame, max, focus } = radialBars({
        rows: browserBars(ctx),
        inner: 30,
        outer: 100,
        guides: [radialGrid({ shape: "circle", stroke: "var(--border)", labels: false })],
      });
      // Recharts draws a radial line at each angle tick, from the inner to the outer radius.
      const ticks = [0, 1, 2, 3].map((index) => ({
        id: `spoke-${index}`,
        angle: (max / 4) * index,
      }));
      return defineChart(
        {
          marks: [
            decorative(
              polar({
                ...frame,
                scales: {
                  angle: frame.scales.angle,
                  radius: { scale: scaleLinear().domain([0, 125]), range: [0, px(125)] },
                },
                marks: [
                  radialRule(ticks, {
                    id: "spokes",
                    key: "id",
                    angle: "angle",
                    radius1: 30,
                    radius2: 100,
                    stroke: "var(--border)",
                  }),
                ],
              }),
            ),
            ...marks,
          ],
          ...polarScene(ctx),
        },
        polarInteraction(ctx, undefined, focus),
      );
    },
  ),
  radialEntry(
    "chart-radial-text",
    "Radial Chart - Text",
    "Radial bar showing 200 Safari visitors",
    (ctx) => {
      const { marks } = radialBars({
        rows: browserBars(ctx),
        start: 0,
        end: 250,
        inner: 80,
        outer: 90,
        background: true,
        cornerRadius: 10,
      });
      return defineChart(
        {
          marks: [gridRing(90, 80), ...marks, centerText({ value: "200", size: 36 })],
          ...polarScene(ctx),
        },
        polarInteraction(ctx),
      );
    },
    { config: safariConfig, data: safariRow(200), tooltip: false },
  ),
  radialEntry(
    "chart-radial-shape",
    "Radial Chart - Shape",
    "Radial bar showing 1,260 Safari visitors",
    (ctx) => {
      const { marks } = radialBars({
        rows: browserBars(ctx),
        end: 100,
        inner: 65,
        outer: 95,
        background: true,
      });
      return defineChart(
        {
          marks: [gridRing(86, 74), ...marks, centerText({ value: "1,260", size: 36 })],
          ...polarScene(ctx),
        },
        polarInteraction(ctx),
      );
    },
    { config: safariConfig, data: safariRow(1260), tooltip: false },
  ),
  radialEntry(
    "chart-radial-stacked",
    "Radial Chart - Stacked",
    "Half radial bar of desktop and mobile visitors stacked",
    (ctx) => {
      const rows = (["mobile", "desktop"] as const)
        .filter((key) => ctx.isVisible(key))
        .map((key) => ({
          ...ctx.data[0]!,
          id: key,
          series: key,
          value: Number(ctx.data[0]![key]),
          band: "january",
        }));
      const { marks, focus } = radialBars({
        rows,
        end: 180,
        inner: 80,
        outer: 110,
        cornerRadius: 5,
        stacked: true,
      });
      const visitors = rows.reduce((sum, row) => sum + row.value, 0).toLocaleString("en-US");
      return defineChart(
        {
          marks: [...marks, centerText({ value: visitors, size: 24, dy: -24 })],
          ...polarScene(ctx),
        },
        // Recharts shows every bar of the hovered band, in render order: Mobile, then Desktop.
        polarInteraction(ctx, undefined, focus, {
          sort: (left, right) => left.datumIndex - right.datumIndex,
        }),
      );
    },
    { config: visitorConfig, data: [{ month: "january", mobile: 570, desktop: 1260 }] },
  ),
];

// Radar charts ---------------------------------------------------------------------------------

type CurveFactory = NonNullable<RadialAreaOptions<unknown>["curve"]>;

/**
 * Straight segments that close back to the first point, as d3 curveLinearClosed does. A ring whose
 * points all sit on one spot (a radar's inner edge at the center) draws nothing.
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

interface RadarSpec {
  keys: readonly string[];
  /** Fill opacity per series. Recharts leaves it unset, which paints at full opacity. */
  fillOpacity?: (series: string) => number;
  /** Outlines with no fill, as shadcn's lines-only radar. */
  linesOnly?: boolean;
  dots?: boolean;
  grid?: "polygon" | "circle" | "none";
  /** Recharts' `radialLines`: the lines from the center to each month. */
  spokes?: boolean;
  /** Ring radii in pixels on a 250px chart, as Recharts' `polarRadius`. */
  rings?: readonly number[];
  /** Fills the grid with a series color at 20% opacity. */
  gridFill?: string;
  /** Month labels. `values` adds "desktop/mobile" above each month, as shadcn's custom label. */
  labels?: "months" | "values" | false;
  /** Value labels on one ray, as Recharts' `PolarRadiusAxis angle={60}`. */
  radiusLabels?: boolean;
}

const radarOuter = 0.8;

/** A Recharts radar chart: series areas on a polygon or circle grid with month labels. */
function radarChart(ctx: Context, spec: RadarSpec) {
  const rows = seriesRows(ctx, "month", spec.keys);
  const all = ctx.data.flatMap((row) => spec.keys.map((key) => Number(row[key])));
  const max = niceMax(Math.max(...all, 1));
  const scales = {
    angle: { scale: scalePoint<string>().domain(months), wrap: true },
    radius: { scale: scaleLinear().domain([0, max]) },
  };
  const channels = {
    angle: "month" as const,
    radius: "value" as const,
    z: "series" as const,
    color: "series" as const,
    key: "id" as const,
  };
  const grid = spec.grid ?? "polygon";
  const gridStyle = {
    stroke: "var(--border)",
    labels: false,
    ...(spec.gridFill ? { fill: spec.gridFill, fillOpacity: 0.2, strokeOpacity: 0.2 } : {}),
  };
  // Recharts puts a ring at each of its four radius ticks, or at each `polarRadius`.
  const ringValues =
    spec.rings?.map((pixels) => (pixels / 100) * max) ??
    [1, 2, 3, 4].map((index) => (max / 4) * index);
  const guides: PolarGuide[] = [];
  if (grid !== "none") {
    guides.push(
      radialGrid({
        ...gridStyle,
        shape: grid,
        // Recharts' radius axis also labels 0 at the center.
        values: spec.radiusLabels ? [0, ...ringValues] : ringValues,
        ...(spec.radiusLabels
          ? {
              labels: true,
              labelAngle: rechartsAngle(60),
              labelFill: "var(--foreground)",
              labelFontSize: 12,
              labelAnchor: "middle" as const,
            }
          : {}),
      }),
    );
  }
  const labels = spec.labels ?? "months";
  guides.push(
    angleGrid({
      ...gridStyle,
      ...(grid === "none" || spec.spokes === false ? { strokeOpacity: 0 } : {}),
      labels: labels === "months",
      labelFill: "var(--muted-foreground)",
      labelFontSize: 12,
      labelOffset: 12,
    }),
  );
  const marks: any[] = [
    polar({
      radiusRatio: radarOuter,
      scales,
      guides,
      marks: spec.keys
        .filter((key) => ctx.isVisible(key))
        .map((key) =>
          radialArea(
            rows.filter((row) => row.series === key),
            {
              ...channels,
              id: `radar-${key}`,
              curve: linearClosed,
              fill: color(key),
              fillOpacity: spec.linesOnly ? 0 : (spec.fillOpacity?.(key) ?? 1),
              ...(spec.linesOnly ? { stroke: color(key), strokeWidth: 2 } : { strokeWidth: 0 }),
            },
          ),
        ),
    }),
  ];
  if (spec.dots) {
    marks.push(
      decorative(
        polar({
          radiusRatio: radarOuter,
          scales,
          marks: [radialDot(rows, { ...channels, id: "dots", r: 4 })],
        }),
      ),
    );
  }
  if (labels === "values") {
    const ticks = ctx.data.map((row) => ({
      id: String(row.month),
      month: row.month,
      pair: `${row.desktop}/${row.mobile}`,
      top: row.month === months[0] ? -10 : 0,
    }));
    const at = {
      key: "id",
      angle: "month",
      radius: max,
      radiusOffset: 10,
      anchor: "outside",
    } as const;
    marks.push(
      decorative(
        polar({
          radiusRatio: radarOuter,
          scales,
          marks: [
            radialText(ticks, {
              ...at,
              id: "tick-values",
              text: "pair",
              dy: (row) => row.top,
              fontSize: 13,
              fontWeight: 500,
              fill: "var(--foreground)",
            }),
            radialText(ticks, {
              ...at,
              id: "tick-months",
              text: "month",
              dy: (row) => row.top + 16,
              fontSize: 12,
              fill: "var(--muted-foreground)",
            }),
          ],
        }),
      ),
    );
  }
  // The dot Recharts draws on each radar at the hovered month.
  marks.push(
    whenFocused(
      polar({
        radiusRatio: radarOuter,
        scales,
        marks: [radialDot(rows, { ...channels, id: "active-dots", r: 4 })],
      }),
      { match: "group" },
    ),
  );
  return marks;
}

const radarDesktop = (april: number) => monthRows({ desktop: [186, 305, 237, april, 209, 214] });
const radarFilledRows = monthRows({ desktop: [186, 285, 237, 203, 209, 264] });
const desktopFill = (series: string) => (series === "desktop" ? 0.6 : 1);

function radarEntry(
  id: string,
  title: string,
  ariaLabel: string,
  spec: RadarSpec,
  options: {
    config?: ChartConfig;
    data?: readonly ChartGalleryRow[];
    presentation?: Presentation;
    legend?: boolean;
  } = {},
): ChartGalleryEntry {
  return {
    id,
    title,
    description: sixMonths,
    config: options.config ?? desktopConfig,
    data: options.data ?? radarDesktop(273),
    footer: trend(halfYear),
    square: 250,
    ...(options.legend ? { legend: true } : {}),
    chart: chartModule(
      id,
      ariaLabel,
      (ctx) =>
        defineChart(
          { marks: radarChart(ctx, spec), ...polarScene(ctx) },
          polarInteraction(ctx, undefined, focusGroupAngle),
        ),
      { aspectRatio: 1, presentation: options.presentation },
    ),
  };
}

const arrowDownFromLineIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: ["M19 3H5", "M12 21V7", "m6 15 6 6 6-6"],
};

const arrowUpFromLineIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: ["m18 9-6-6-6 6", "M12 3v14", "M5 21h14"],
};

const radarEntries: ChartGalleryEntry[] = [
  radarEntry("chart-radar-default", "Radar Chart", "Radar chart of desktop visitors", {
    keys: ["desktop"],
    fillOpacity: () => 0.6,
  }),
  radarEntry(
    "chart-radar-dots",
    "Radar Chart - Dots",
    "Radar chart of desktop visitors with dots",
    { keys: ["desktop"], fillOpacity: () => 0.6, dots: true },
  ),
  radarEntry(
    "chart-radar-lines-only",
    "Radar Chart - Lines Only",
    "Radar chart of desktop and mobile visitors drawn as outlines",
    { keys: ["desktop", "mobile"], linesOnly: true, spokes: false },
    {
      config: visitorConfig,
      data: monthRows({
        desktop: [186, 185, 207, 173, 160, 174],
        mobile: [160, 170, 180, 160, 190, 204],
      }),
      presentation: { indicator: "line" },
    },
  ),
  radarEntry(
    "chart-radar-label-custom",
    "Radar Chart - Custom Label",
    "Radar chart of desktop and mobile visitors with both values at each month",
    { keys: ["desktop", "mobile"], fillOpacity: desktopFill, labels: "values" },
    { config: visitorConfig, data: visitorRows, presentation: { indicator: "line" } },
  ),
  radarEntry(
    "chart-radar-grid-custom",
    "Radar Chart - Grid Custom",
    "Radar chart of desktop visitors on a single grid ring",
    { keys: ["desktop"], fillOpacity: () => 0.6, spokes: false, rings: [90] },
    { presentation: { hideLabel: true } },
  ),
  radarEntry(
    "chart-radar-grid-none",
    "Radar Chart - Grid None",
    "Radar chart of desktop visitors with no grid",
    { keys: ["desktop"], fillOpacity: () => 0.6, dots: true, grid: "none" },
    { presentation: { hideLabel: true } },
  ),
  radarEntry(
    "chart-radar-grid-circle",
    "Radar Chart - Grid Circle",
    "Radar chart of desktop visitors on a circular grid",
    { keys: ["desktop"], fillOpacity: () => 0.6, dots: true, grid: "circle" },
    { presentation: { hideLabel: true } },
  ),
  radarEntry(
    "chart-radar-grid-circle-no-lines",
    "Radar Chart - Grid Circle - No lines",
    "Radar chart of desktop visitors on circular rings with no radial lines",
    { keys: ["desktop"], fillOpacity: () => 0.6, dots: true, grid: "circle", spokes: false },
    { data: radarDesktop(203), presentation: { hideLabel: true } },
  ),
  radarEntry(
    "chart-radar-grid-circle-fill",
    "Radar Chart - Grid Circle Filled",
    "Radar chart of desktop visitors on a filled circular grid",
    { keys: ["desktop"], fillOpacity: () => 0.5, grid: "circle", gridFill: color("desktop") },
    { data: radarFilledRows },
  ),
  radarEntry(
    "chart-radar-grid-fill",
    "Radar Chart - Grid Filled",
    "Radar chart of desktop visitors on a filled grid",
    { keys: ["desktop"], fillOpacity: () => 0.5, gridFill: color("desktop") },
    { data: radarFilledRows, presentation: { hideLabel: true } },
  ),
  radarEntry(
    "chart-radar-multiple",
    "Radar Chart - Multiple",
    "Radar chart of desktop and mobile visitors",
    { keys: ["desktop", "mobile"], fillOpacity: desktopFill },
    { config: visitorConfig, data: visitorRows, presentation: { indicator: "line" } },
  ),
  radarEntry(
    "chart-radar-legend",
    "Radar Chart - Legend",
    "Radar chart of desktop and mobile visitors with a legend",
    { keys: ["desktop", "mobile"], fillOpacity: desktopFill },
    { config: visitorConfig, data: visitorRows, presentation: { indicator: "line" }, legend: true },
  ),
  radarEntry(
    "chart-radar-icons",
    "Radar Chart - Icons",
    "Radar chart of desktop and mobile visitors with icons in the legend",
    { keys: ["desktop", "mobile"], fillOpacity: desktopFill },
    {
      config: {
        desktop: { ...visitorConfig.desktop, icon: arrowDownFromLineIcon },
        mobile: { ...visitorConfig.mobile, icon: arrowUpFromLineIcon },
      },
      data: visitorRows,
      presentation: { indicator: "line" },
      legend: true,
    },
  ),
  radarEntry(
    "chart-radar-radius",
    "Radar Chart - Radius Axis",
    "Radar chart of desktop and mobile visitors with values on a radius axis",
    { keys: ["desktop", "mobile"], fillOpacity: desktopFill, labels: false, radiusLabels: true },
    {
      config: visitorConfig,
      data: visitorRows,
      // shadcn's `labelKey="month"` names no config key, so its tooltip has no heading.
      presentation: { indicator: "line", hideLabel: true },
    },
  ),
];

// Tooltips -------------------------------------------------------------------------------------

const activityConfig = {
  running: { label: "Running", color: "var(--chart-1)" },
  swimming: { label: "Swimming", color: "var(--chart-2)" },
} satisfies ChartConfig;

const activityRows: ChartGalleryRow[] = [
  ["2024-07-15", 450, 300],
  ["2024-07-16", 380, 420],
  ["2024-07-17", 520, 120],
  ["2024-07-18", 140, 550],
  ["2024-07-19", 600, 350],
  ["2024-07-20", 480, 400],
].map(([date, running, swimming]) => ({ date: date!, running: running!, swimming: swimming! }));

/** Lucide `footprints` as portable icon data. */
const footprintsIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: [
    "M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z",
    "M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z",
    "M16 17h4",
    "M4 13h4",
  ],
};

/** Lucide `waves` as portable icon data. */
const wavesIcon: ChartIcon = {
  viewBox: "0 0 24 24",
  paths: [
    "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  ],
};

const weekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

/** Running under swimming, with the outer corners rounded, as shadcn's tooltip charts. */
const activityChart = (ctx: Context) =>
  defineChart(
    {
      marks: [
        // shadcn's custom label variant uses `labelKey: "activities"`, a config key. Each row
        // names that key, so the heading shows its config label.
        barY(
          seriesRows(ctx, "date", ["running", "swimming"]).map(
            (row): Datum => ({ ...row, activities: "activities" }),
          ),
          {
            id: "bars",
            x: "date",
            y: "value",
            z: "series",
            color: "series",
            key: "id",
            radius: (row: Datum) =>
              row.series === "running" ? [0, 0, 4, 4] : ([4, 4, 0, 0] as const),
          },
        ),
      ],
      scales: {
        x: {
          scale: scaleBand<string>()
            .domain(activityRows.map((row) => String(row.date)))
            .paddingInner(0.2)
            .paddingOuter(0.1),
          axis: categoryAxis(weekday, 10),
        },
        y: valueAxis(false),
      },
      ...scene(ctx),
    },
    interaction(ctx, { labelKey: "date" }),
  );

/** The value and unit block of shadcn's formatter rows. */
const kcal = (value: unknown) => ({ value: String(value), unit: "kcal" });

const tooltipFormatter: ChartGalleryFormat = {
  row: (value, name) => ({
    kind: "unit",
    name: activityConfig[name as keyof typeof activityConfig]?.label ?? name,
    ...kcal(value),
  }),
};

const tooltipAdvanced: ChartGalleryFormat = {
  row: (value, name, item, index) => ({
    kind: "swatch",
    key: name,
    name: activityConfig[name as keyof typeof activityConfig]?.label ?? name,
    ...kcal(value),
    // shadcn adds the total after the last item.
    ...(index === 1
      ? { total: String(Number(item.payload.running) + Number(item.payload.swimming)) }
      : {}),
  }),
};

const tooltipLabelFormatter: ChartGalleryFormat = {
  label: (label) =>
    new Date(`${String(label)}T00:00:00Z`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
};

function tooltipEntry(
  id: string,
  title: string,
  description: string,
  ariaLabel: string,
  options: { config?: ChartConfig; presentation?: Presentation; format?: ChartGalleryFormat } = {},
): ChartGalleryEntry {
  return {
    id,
    title,
    description,
    config: options.config ?? activityConfig,
    data: activityRows,
    ...(options.format ? { format: options.format } : {}),
    chart: chartModule(id, ariaLabel, activityChart, {
      presentation: options.presentation,
      format: options.format,
    }),
  };
}

const tooltipEntries: ChartGalleryEntry[] = [
  tooltipEntry(
    "chart-tooltip-default",
    "Tooltip - Default",
    "Default tooltip with ChartTooltipContent.",
    "Stacked bar chart of running and swimming with the default tooltip",
  ),
  tooltipEntry(
    "chart-tooltip-indicator-line",
    "Tooltip - Line Indicator",
    "Tooltip with line indicator.",
    "Stacked bar chart of running and swimming with a line indicator tooltip",
    { presentation: { indicator: "line" } },
  ),
  tooltipEntry(
    "chart-tooltip-indicator-none",
    "Tooltip - No Indicator",
    "Tooltip with no indicator.",
    "Stacked bar chart of running and swimming with a tooltip that has no indicator",
    { presentation: { hideIndicator: true } },
  ),
  tooltipEntry(
    "chart-tooltip-label-custom",
    "Tooltip - Custom label",
    "Tooltip with custom label from chartConfig.",
    "Stacked bar chart of running and swimming with a tooltip label from the config",
    {
      config: { activities: { label: "Activities" }, ...activityConfig },
      presentation: { labelKey: "activities", indicator: "line" },
    },
  ),
  tooltipEntry(
    "chart-tooltip-label-formatter",
    "Tooltip - Label Formatter",
    "Tooltip with label formatter.",
    "Stacked bar chart of running and swimming with a formatted date label",
    { format: tooltipLabelFormatter },
  ),
  tooltipEntry(
    "chart-tooltip-label-none",
    "Tooltip - No Label",
    "Tooltip with no label.",
    "Stacked bar chart of running and swimming with a tooltip that has no label",
    { presentation: { hideIndicator: true, hideLabel: true } },
  ),
  tooltipEntry(
    "chart-tooltip-formatter",
    "Tooltip - Formatter",
    "Tooltip with custom formatter .",
    "Stacked bar chart of running and swimming with values in kilocalories",
    { presentation: { hideLabel: true }, format: tooltipFormatter },
  ),
  tooltipEntry(
    "chart-tooltip-icons",
    "Tooltip - Icons",
    "Tooltip with icons.",
    "Stacked bar chart of running and swimming with icons in the tooltip",
    {
      config: {
        running: { ...activityConfig.running, icon: footprintsIcon },
        swimming: { ...activityConfig.swimming, icon: wavesIcon },
      },
      presentation: { hideLabel: true },
    },
  ),
  tooltipEntry(
    "chart-tooltip-advanced",
    "Tooltip - Advanced",
    "Tooltip with custom formatter and total.",
    "Stacked bar chart of running and swimming with values in kilocalories and a total",
    { presentation: { hideLabel: true }, format: tooltipAdvanced },
  ),
];

/** Every gallery view and its entries, in shadcn order. */
export const chartGallery: Record<ChartGalleryType, readonly ChartGalleryEntry[]> = {
  area: areaEntries,
  bar: barEntries,
  line: lineEntries,
  pie: pieEntries,
  radar: radarEntries,
  radial: radialEntries,
  tooltip: tooltipEntries,
};

export function isChartGalleryType(value: unknown): value is ChartGalleryType {
  return chartGalleryTypes.some((item) => item.type === value);
}
