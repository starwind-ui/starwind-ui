import {
  areaY,
  barY,
  type ChartCurve,
  type ChartValue,
  type DomChartDefinition,
  defineChart,
  dot,
  group,
  lineY,
  stack,
  text,
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
import { stackRowsY } from "@tanstack/charts/transform/stack";

import { linearClosedCurve, monotoneCurve, naturalCurve, stepCurve } from "./curves";
import { ID, isDevelopment, type MarkRow, ROW, SERIES, VALUE, valueText, X } from "./datum";
import { type ChartTickFormatter, resolveTickFormatter } from "./format";
import {
  CHART_SPEC_OPTION_DEFAULTS as CHART_DEFAULTS,
  CHART_MARK_KINDS,
  CHART_PART_DEFAULTS as DEFAULTS,
  CHART_GRADIENT_FILL_OPACITY as GRADIENT_FILL_OPACITY,
  CHART_MARK_LABEL_DEFAULTS as LABEL_DEFAULTS,
} from "./part-defaults";
import { configText } from "./presentation";
import type { ChartConfig, ChartContext, ChartFactory } from "./types";

/** The curve of a line or an area, as Recharts `type`. */
export type ChartCurveType = "natural" | "monotone" | "linear" | "step";

/**
 * A pie or radial bar radius, as Recharts reads it. A number is plain pixels at any chart size. A
 * percent string is a share of the available radius, half the chart's smaller side.
 */
export type ChartRadius = number | `${number}%`;

/**
 * The corner radii of a bar in pixels, as Recharts reads a radius array: top left, top right,
 * bottom right, then bottom left.
 */
export type ChartBarCornerRadii = readonly [number, number, number, number];

/** The look of the dots of a line or radar, as a Recharts `dot` or `activeDot` object. */
export interface ChartDotStyle {
  /** The dot radius in pixels. */
  r?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
}

/** `true` draws the default dots, `false` draws none, and an object draws dots with that look. */
export type ChartDot = boolean | ChartDotStyle;

/**
 * Where a mark label sits, as Recharts \`position\`. \`top\` sits above a bar or a point.
 * \`inside\` sits in the middle of a bar or a slice, or on a point. \`outside\` sits past the free
 * end of a bar, above a point, or outside a slice. \`insideStart\` sits in a bar next to its base.
 * \`insideLeft\` and \`right\` start the text right of a point. On a bar they sit in the middle, and
 * a slice puts every position other than \`outside\` in its middle.
 */
export type ChartLabelPosition =
  | "top"
  | "inside"
  | "insideLeft"
  | "insideStart"
  | "right"
  | "outside";

/** The look of the labels of a mark, as a Recharts \`label\` or \`LabelList\`. */
export interface ChartMarkLabelStyle {
  /** The row field that each label shows. Defaults to the value that the mark draws. */
  dataKey?: string;
  /** Defaults to \`"inside"\`, or \`"outside"\` on a pie, as in Recharts. */
  position?: ChartLabelPosition;
  /** The gap between the mark and the label in pixels. Defaults to 5, or 20 on a pie. */
  offset?: number;
  /** The text color. Defaults to the foreground color. */
  fill?: string;
  /** Defaults to 12. */
  fontSize?: number;
  /** Formats the label text: a function or a \`ChartFormat\` object. */
  formatter?: ChartTickFormatter;
}

/** \`true\` draws the default labels, \`false\` draws none, and an object sets their look. */
export type ChartMarkLabel = boolean | ChartMarkLabelStyle;

export interface ChartBarPart {
  kind: "bar";
  dataKey: string;
  /** Bars with the same `stackId` stack. Other bars group. */
  stackId?: string | number;
  /**
   * The corner radius in pixels. A number rounds the bar end. Four numbers set each corner: top
   * left, top right, bottom right and bottom left.
   */
  radius?: number | ChartBarCornerRadii;
  fill?: string;
  /** Draws a label on each bar. Defaults to \`false\`. */
  label?: ChartMarkLabel;
}

export interface ChartLinePart {
  kind: "line";
  dataKey: string;
  /** Defaults to `"natural"`. */
  type?: ChartCurveType;
  /** Defaults to 2. */
  strokeWidth?: number;
  /** Draws a dot at every value. Defaults to `false`. An object sets the dot look. */
  dot?: ChartDot;
  /** Draws a dot at the focused value. Defaults to `true`. An object sets the dot look. */
  activeDot?: ChartDot;
  stroke?: string;
  /** Draws a label at each value. Defaults to \`false\`. */
  label?: ChartMarkLabel;
}

export interface ChartAreaPart {
  kind: "area";
  dataKey: string;
  /** Defaults to `"monotone"`. */
  type?: ChartCurveType;
  /** Areas with the same `stackId` stack. Other areas overlap. */
  stackId?: string | number;
  /** Defaults to 0.22. */
  fillOpacity?: number;
  /** Defaults to 2. */
  strokeWidth?: number;
  /** Draws a dot at the focused value. Defaults to `true`. */
  activeDot?: boolean;
  fill?: string;
  stroke?: string;
  /** Draws a label at each value. Defaults to \`false\`. */
  label?: ChartMarkLabel;
}

export interface ChartPiePart {
  kind: "pie";
  dataKey: string;
  /** The key whose values name the slices. Slice colors come from config by this value. */
  nameKey: string;
  /** Defaults to 0, a full pie. A radius above 0 draws a donut. */
  innerRadius?: ChartRadius;
  /** Defaults to `"90%"`. */
  outerRadius?: ChartRadius;
  /** The gap between slices in degrees. Defaults to a gap of about 1.4 degrees. */
  paddingAngle?: number;
  /** The color of the line between slices. Defaults to the card color. */
  stroke?: string;
  /** The width of the line between slices in pixels. Defaults to 2. */
  strokeWidth?: number;
  /** Draws a label on each slice. Defaults to \`false\`. */
  label?: ChartMarkLabel;
  /** Draws a line from each slice to its outside label. Defaults to \`true\`. */
  labelLine?: boolean;
}

export interface ChartRadarPart {
  kind: "radar";
  dataKey: string;
  /** Defaults to 0.18. */
  fillOpacity?: number;
  /** Defaults to 2. */
  strokeWidth?: number;
  /** Draws a dot at every value. Defaults to `false`. An object sets the dot look. */
  dot?: ChartDot;
  /** Draws dots at the focused values. Defaults to `true`. An object sets the dot look. */
  activeDot?: ChartDot;
}

export interface ChartRadialBarPart {
  kind: "radialBar";
  dataKey: string;
  /** The key whose values name the bars. Bar colors come from config by this value. */
  nameKey: string;
  /** Defaults to `"24%"`, 30px on a 250px chart. */
  innerRadius?: ChartRadius;
  /** Defaults to `"88%"`, 110px on a 250px chart. */
  outerRadius?: ChartRadius;
  /** Draws the muted track behind each bar. */
  background?: boolean;
}

export interface ChartXAxisPart {
  kind: "xAxis";
  /** The category key of a cartesian chart. */
  dataKey: string;
  tickFormatter?: ChartTickFormatter;
  /** Draws tick lines. Defaults to `false`. */
  tickLine?: boolean;
  /** Draws the axis line. Defaults to `false`. */
  axisLine?: boolean;
  /** The gap between a tick and its label in pixels. */
  tickMargin?: number;
  /** Keeps the scale and hides the axis. */
  hide?: boolean;
}

export interface ChartYAxisPart {
  kind: "yAxis";
  tickFormatter?: ChartTickFormatter;
  /** Draws tick lines. Defaults to `false`. */
  tickLine?: boolean;
  /** Draws the axis line. Defaults to `false`. */
  axisLine?: boolean;
  /** The gap between a tick and its label in pixels. */
  tickMargin?: number;
  hide?: boolean;
  /** The preferred number of ticks. Defaults to 5. */
  tickCount?: number;
}

export interface ChartGridPart {
  kind: "grid";
  /** Draws vertical lines. Defaults to `true`. */
  vertical?: boolean;
  /** Draws horizontal lines. Defaults to `true`. */
  horizontal?: boolean;
}

export interface ChartPolarGridPart {
  kind: "polarGrid";
  /** Defaults to `"polygon"`. */
  gridType?: "polygon" | "circle";
  /** Draws the lines from the center to each category. Defaults to `true`. */
  radialLines?: boolean;
  /** The fill color of the rings. Defaults to no fill. */
  fill?: string;
  fillOpacity?: number;
  /** The color of the rings and lines. Defaults to the border color. */
  stroke?: string;
  /** The width of the rings and lines in pixels. Defaults to 1. */
  strokeWidth?: number;
  /** The ring radii in pixels. Defaults to rings at the value ticks. */
  polarRadius?: readonly number[];
}

export interface ChartPolarAngleAxisPart {
  kind: "polarAngleAxis";
  /** The category key of a radar chart. */
  dataKey: string;
  tickFormatter?: ChartTickFormatter;
}

export interface ChartLabelPart {
  kind: "label";
  position?: "center";
  /** The text. Without it, a pie shows the total of its visible slices. */
  value?: string | number;
  /** Moves the text down by this many pixels. A negative value moves it up. Defaults to 0. */
  dy?: number;
  /** Defaults to 28. */
  fontSize?: number;
  /** The font weight. Defaults to 400, and at 400 the text keeps the weight of the page. */
  fontWeight?: number;
  /** The text color. Defaults to the foreground color. */
  fill?: string;
}

/** A gradient position: a number, a number string or a percent string, as SVG reads it. */
export type ChartGradientCoordinate = number | `${number}` | `${number}%`;

/** One color stop of a gradient, as an SVG `<stop>`. */
export interface ChartGradientStop {
  /** Where the stop sits: a number from 0 to 1, or a percent string such as `"5%"`. */
  offset: number | `${number}` | `${number}%`;
  stopColor: string;
  /** Defaults to 1. */
  stopOpacity?: number;
}

/**
 * A linear gradient that a `fill="url(#id)"` on a bar or an area uses, as an SVG
 * `<linearGradient>`. The chart scopes the id, so two charts can use the same id.
 */
export interface ChartLinearGradientPart {
  kind: "linearGradient";
  id: string;
  /** Defaults to 0. The four coordinates default to a gradient from left to right, as in SVG. */
  x1?: ChartGradientCoordinate;
  /** Defaults to 0. */
  y1?: ChartGradientCoordinate;
  /** Defaults to 1. */
  x2?: ChartGradientCoordinate;
  /** Defaults to 0. */
  y2?: ChartGradientCoordinate;
  stops: readonly ChartGradientStop[];
}

export type ChartMarkPart =
  | ChartBarPart
  | ChartLinePart
  | ChartAreaPart
  | ChartPiePart
  | ChartRadarPart
  | ChartRadialBarPart;

export type ChartGuidePart =
  | ChartXAxisPart
  | ChartYAxisPart
  | ChartGridPart
  | ChartPolarGridPart
  | ChartPolarAngleAxisPart
  | ChartLabelPart
  | ChartLinearGradientPart;

export type ChartPart = ChartMarkPart | ChartGuidePart;

/** How stacked bars and areas stack, as Recharts `stackOffset`. */
export type ChartStackOffset = "none" | "expand";

/**
 * Options that belong to the whole chart, as Recharts sets them on the chart or the tooltip. A
 * framework adapter fills them from the props of the part that sets them.
 */
export interface ChartSpecOptions {
  /**
   * Draws the hover band of a bar chart. Defaults to `true`. Line and area charts draw no hover
   * rule.
   */
  cursor?: boolean;
  /** `"expand"` stacks each category to 100%. Defaults to `"none"`. */
  stackOffset?: ChartStackOffset;
}

/**
 * A chart described as plain data, in the order of its parts, with its chart-level options. The
 * Runtime turns it into a TanStack chart definition. Only `tickFormatter` can hold a function, and
 * a function cannot travel in the wire payload.
 */
export interface ChartSpec extends ChartSpecOptions {
  parts: readonly ChartPart[];
}

type Row = Record<string, any>;
type MarkKind = ChartMarkPart["kind"];
type PartOf<K extends ChartPart["kind"]> = Extract<ChartPart, { kind: K }>;

/** Fails to compile when a part default does not fit its part prop type. */
type FitsParts<T extends { [K in ChartPart["kind"]]: Partial<Omit<PartOf<K>, "kind">> }> = T;
export type ChartPartDefaults = FitsParts<typeof DEFAULTS>;
/** Fails to compile when a chart-level option has no default or a default does not fit. */
type FitsOptions<T extends Required<ChartSpecOptions>> = T;
export type ChartSpecOptionDefaults = FitsOptions<typeof CHART_DEFAULTS>;
/** Fails to compile when the mark kind list misses a mark part kind or names another kind. */
type SameKinds<T extends true> = T;
export type ChartMarkKinds = SameKinds<
  [MarkKind] extends [(typeof CHART_MARK_KINDS)[number]]
    ? [(typeof CHART_MARK_KINDS)[number]] extends [MarkKind]
      ? true
      : false
    : false
>;

const PART_NAMES: Record<ChartPart["kind"], string> = {
  bar: "ChartBar",
  line: "ChartLine",
  area: "ChartArea",
  pie: "ChartPie",
  radar: "ChartRadar",
  radialBar: "ChartRadialBar",
  xAxis: "ChartXAxis",
  yAxis: "ChartYAxis",
  grid: "ChartGrid",
  polarGrid: "ChartPolarGrid",
  polarAngleAxis: "ChartPolarAngleAxis",
  label: "ChartLabel",
  linearGradient: "ChartLinearGradient",
};

const KIND_NAMES: Record<MarkKind, string> = {
  bar: "bar",
  line: "line",
  area: "area",
  pie: "pie",
  radar: "radar",
  radialBar: "radial bar",
};

const MARK_KINDS = new Set<string>(CHART_MARK_KINDS);
const POLAR_KINDS = new Set<string>(["pie", "radar", "radialBar"]);
const BORDER = "var(--border)";
const CARD = "var(--card)";

const CURVES: Record<ChartCurveType, ChartCurve | undefined> = {
  natural: naturalCurve,
  monotone: monotoneCurve,
  step: stepCurve,
  linear: undefined,
};

function isMark(part: ChartPart): part is ChartMarkPart {
  return MARK_KINDS.has(part.kind);
}

function partsOf<K extends ChartPart["kind"]>(spec: ChartSpec, kind: K): PartOf<K>[] {
  return spec.parts.filter((part): part is PartOf<K> => part.kind === kind);
}

function guideOf<K extends ChartGuidePart["kind"]>(
  spec: ChartSpec,
  kind: K,
): PartOf<K> | undefined {
  return partsOf(spec, kind)[0];
}

/**
 * The category key of a cartesian chart. A ChartXAxis names it. Without one, as Recharts draws
 * without an XAxis, it is the first field of the first data row that holds a string or a `Date`
 * and is not a config key or a mark dataKey. It is `undefined` when no field fits.
 */
function categoryKeyOf(
  spec: ChartSpec,
  data: readonly unknown[] | undefined,
  config: ChartConfig | undefined,
): string | undefined {
  const axisKey = guideOf(spec, "xAxis")?.dataKey;
  if (axisKey) return axisKey;
  const row = Array.isArray(data) ? data[0] : undefined;
  if (!row || typeof row !== "object") return undefined;
  const marks = new Set(spec.parts.filter((part) => !!part && isMark(part)).map((p) => p.dataKey));
  return Object.keys(row).find((key) => {
    const value = (row as Row)[key];
    return (
      !marks.has(key) &&
      !(config && Object.hasOwn(config, key)) &&
      (typeof value === "string" || value instanceof Date)
    );
  });
}

const CATEGORY_GAP =
  "a ChartXAxis with the category dataKey, or data rows with a string or Date category field";

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/** Lists the mark kinds of a spec in part order and checks that they can share one chart. */
function markKinds(spec: ChartSpec): MarkKind[] {
  if (!spec || !Array.isArray(spec.parts)) throw new TypeError("A chart spec needs a parts array.");
  for (const part of spec.parts)
    if (!part || typeof part !== "object" || !(part.kind in PART_NAMES))
      throw new TypeError(`Unknown chart part kind: ${String((part as ChartPart)?.kind)}.`);
  const kinds = unique(spec.parts.filter(isMark).map((part) => part.kind));
  if (!kinds.length)
    throw new TypeError(
      "A chart spec needs a mark part: ChartBar, ChartLine, ChartArea, ChartPie, ChartRadar or ChartRadialBar.",
    );
  const polar = kinds.find((kind) => POLAR_KINDS.has(kind));
  if (polar && kinds.length > 1) {
    const others = kinds.filter((kind) => kind !== polar).map((kind) => PART_NAMES[kind]);
    throw new TypeError(
      `${PART_NAMES[polar]} cannot share a chart with ${others.join(" or ")}. A pie, radar or radial bar chart takes one mark kind. Only ChartBar, ChartLine and ChartArea can mix.`,
    );
  }
  for (const kind of ["pie", "radialBar"] as const)
    if (partsOf(spec, kind).length > 1)
      throw new TypeError(`A chart takes one ${PART_NAMES[kind]}.`);
  return kinds;
}

/**
 * Throws when a spec cannot travel in the wire payload. A function `tickFormatter` works in
 * framework code, but only a `ChartFormat` object reaches the browser.
 */
export function assertChartSpecWire(spec: ChartSpec): void {
  const check = (part: ChartPart, prop: string, value: unknown) => {
    if (typeof value === "function")
      throw new TypeError(
        `${PART_NAMES[part.kind]} ${prop} is a function, and a function cannot reach the browser. Use a ChartFormat object such as { maxLength: 3 }, or move the formatter into a chart module.`,
      );
  };
  for (const part of spec?.parts ?? []) {
    check(part, "tickFormatter", (part as { tickFormatter?: unknown }).tickFormatter);
    const label = (part as { label?: unknown }).label;
    if (label && typeof label === "object")
      check(part, "label formatter", (label as { formatter?: unknown }).formatter);
  }
}

/** The default accessible name of a spec chart, such as "Bar chart of Desktop and Mobile". */
export function chartSpecAriaLabel(spec: ChartSpec, config: ChartConfig): string {
  const pieHole = hasHole(partsOf(spec, "pie")[0]?.innerRadius);
  const kinds = markKinds(spec).map((kind) =>
    kind === "pie" && pieHole ? "donut" : KIND_NAMES[kind],
  );
  const names = kinds.length > 1 ? `${joinWords(kinds)} chart` : `${kinds[0]} chart`;
  const labels = unique(spec.parts.filter(isMark).map((part) => part.dataKey)).map((key) =>
    configText(config[key], key),
  );
  const name = names.charAt(0).toUpperCase() + names.slice(1);
  return labels.length ? `${name} of ${joinWords(labels)}` : name;
}

function joinWords(words: readonly string[]): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

function baseInteraction() {
  return {
    svgAnimation: false as const,
    focusRing: false as const,
    maxFocusDistance: Number.POSITIVE_INFINITY,
    focus: "group-x" as const,
  };
}

const warnedKeys = new Set<string>();

/** Warns once in development about a series key that has no config entry. */
function warnMissingConfig(part: string, key: string): void {
  if (!isDevelopment()) return;
  const message = `Starwind chart: ${part} series "${key}" has no chart config entry. The chart draws it with a fallback color. Add "${key}" to the config to set its label and color.`;
  if (warnedKeys.has(message)) return;
  warnedKeys.add(message);
  // biome-ignore lint/suspicious/noConsole: the development warning names the missing config key.
  console.warn(message);
}

interface SeriesColors {
  /** The color scale. Keys without a config entry get a fallback color. */
  color: { domain: string[]; range: string[] };
  /** The fill color of a series. */
  fill(series: unknown): string;
  /** The `--color-*` color of a series, as Recharts examples set `stroke`. */
  stroke(series: unknown): string;
  /** True when the series shows: it has no config entry, or its config key is visible. */
  shows(series: unknown): boolean;
}

/**
 * Colors and visibility for the series of a chart. `series` lists every series in order, hidden
 * or not, so a fallback color stays the same when other series hide.
 */
function seriesColors(
  ctx: ChartContext<Row>,
  part: string | ((key: string) => string),
  series: readonly unknown[],
): SeriesColors {
  const known = (key: string) => Object.hasOwn(ctx.config, key);
  const fallback = new Map<string, string>();
  unique(series.map(String)).forEach((key, index) => {
    if (known(key)) return;
    fallback.set(key, `var(--chart-${(index % 5) + 1})`);
    warnMissingConfig(typeof part === "string" ? part : part(key), key);
  });
  return {
    color: fallback.size
      ? {
          domain: [...ctx.color.domain, ...fallback.keys()],
          range: [...ctx.color.range, ...fallback.values()],
        }
      : ctx.color,
    fill: (key) => fallback.get(String(key)) ?? `var(--sw-chart-color-${String(key)})`,
    stroke: (key) => fallback.get(String(key)) ?? `var(--color-${String(key)})`,
    shows: (key) => fallback.has(String(key)) || ctx.isVisible(String(key)),
  };
}

/** One mark row per category and series, as Recharts reads wide rows. Hidden series drop out. */
function markRows(
  ctx: ChartContext<Row>,
  colors: SeriesColors,
  keys: readonly string[],
  categoryKey: string,
): MarkRow[] {
  const rows: MarkRow[] = [];
  for (const row of ctx.data)
    for (const key of keys)
      if (colors.shows(key))
        rows.push({
          [ROW]: row,
          [X]: row[categoryKey],
          [SERIES]: key,
          [VALUE]: row[key],
          [ID]: `${valueText(row[categoryKey])}-${key}`,
        });
  return rows;
}

/** A visual channel that gives each series its own value, or `undefined` when no part sets one. */
function bySeries<P extends { dataKey: string }, K extends keyof P, T>(
  parts: readonly P[],
  prop: K,
  fallback: (series: string) => T,
): ((row: Row) => T) | undefined {
  const values = new Map(
    parts
      .filter((part) => part[prop] !== undefined)
      .map((part) => [part.dataKey, part[prop] as unknown as T]),
  );
  if (!values.size) return undefined;
  return (row) => values.get(String(row[SERIES])) ?? fallback(String(row[SERIES]));
}

/** Splits parts into marks: parts with a shared `stackId` stack in one mark. */
function stackGroups<P extends { stackId?: string | number }>(parts: readonly P[]): P[][] {
  const counts = new Map<string | number, number>();
  for (const part of parts)
    if (part.stackId !== undefined) counts.set(part.stackId, (counts.get(part.stackId) ?? 0) + 1);
  const groups: P[][] = [];
  const byId = new Map<string | number, P[]>();
  for (const part of parts) {
    const id = part.stackId;
    if (id !== undefined && (counts.get(id) ?? 0) > 1) {
      const existing = byId.get(id);
      if (existing) existing.push(part);
      else {
        const created = [part];
        byId.set(id, created);
        groups.push(created);
      }
    } else groups.push([part]);
  }
  return groups;
}

/** Splits parts into marks that share the same values for `props`. */
function styleGroups<P extends object>(parts: readonly P[], props: readonly (keyof P)[]): P[][] {
  const groups = new Map<string, P[]>();
  for (const part of parts) {
    const key = JSON.stringify(props.map((prop) => part[prop] ?? null));
    const existing = groups.get(key);
    if (existing) existing.push(part);
    else groups.set(key, [part]);
  }
  return [...groups.values()];
}

const markId = (base: string, index: number) => (index === 0 ? base : `${base}-${index + 1}`);

/** The defined fields of a dot object, in a fixed order, so equal looks share one mark. */
function dotStyle(value: ChartDot): ChartDotStyle {
  if (typeof value !== "object" || value === null) return {};
  const style: Record<string, unknown> = {};
  for (const name of ["r", "fill", "fillOpacity", "stroke", "strokeWidth"] as const)
    if (value[name] !== undefined) style[name] = value[name];
  return style;
}

/**
 * The series keys that draw a dot, grouped by dot look in part order. Each group becomes one dot
 * mark. One look, as in every chart without dot objects, gives one group.
 */
function dotGroups<P extends { dataKey: string; dot?: ChartDot; activeDot?: ChartDot }>(
  parts: readonly P[],
  prop: "dot" | "activeDot",
  fallback: boolean,
): { keys: string[]; style: ChartDotStyle }[] {
  const groups = new Map<string, { keys: string[]; style: ChartDotStyle }>();
  for (const part of parts) {
    const value = part[prop] ?? fallback;
    if (value === false) continue;
    const style = dotStyle(value);
    const id = JSON.stringify(style);
    const group = groups.get(id) ?? { keys: [], style };
    if (!group.keys.includes(part.dataKey)) group.keys.push(part.dataKey);
    groups.set(id, group);
  }
  return [...groups.values()];
}

/**
 * The TanStack stack offset of a spec. `"expand"` is TanStack `"normalize"`: each category stacks
 * to 1. The y values stay raw, so the tooltip shows them.
 */
function stackOffsetOf(spec: ChartSpec): { offset?: "normalize" } {
  return (spec.stackOffset ?? CHART_DEFAULTS.stackOffset) === "expand"
    ? { offset: "normalize" }
    : {};
}

/**
 * True when a mark group stacks to 100%: the chart stacks with `"expand"` and the group has a
 * `stackId`, as Recharts. A named stack with one visible series fills to 100% too.
 */
function normalizes(
  members: readonly { stackId?: string | number }[],
  offset: { offset?: "normalize" },
): boolean {
  return !!offset.offset && members[0]?.stackId !== undefined;
}

/**
 * Stack bounds for each mark row, by mark row id: \`y1\` at the base of the bar and \`y2\` at its
 * free end. A negative value grows down, so its base is the higher bound. A stack to 100% draws
 * each segment where the normalized bounds put it, above zero also for a negative value, so it
 * keeps the order of those bounds. The bar end radius and the labels read the free end from \`y2\`.
 */
function stackBounds(
  rows: readonly MarkRow[],
  offset: { offset?: "normalize" },
): Map<unknown, { y1: number; y2: number }> {
  const stacked = stackRowsY(rows, { x: X, y: VALUE, z: SERIES, ...offset }) as Row[];
  return new Map(
    stacked.map((row) => {
      const low = Math.min(row.y1, row.y2);
      const high = Math.max(row.y1, row.y2);
      const down = offset.offset ? row.y2 < row.y1 : Number(row[VALUE]) < 0;
      return [row[ID], down ? { y1: high, y2: low } : { y1: low, y2: high }];
    }),
  );
}

const Y1 = "sw:y1";
const Y2 = "sw:y2";
const SLOT = "sw:slot";

function axisPresentation(
  axis: ChartXAxisPart | ChartYAxisPart,
  config: ChartConfig,
  count?: number,
  fallback?: (value: unknown) => string,
) {
  const format =
    resolveTickFormatter(axis.tickFormatter, `${PART_NAMES[axis.kind]} tickFormatter`, config) ??
    fallback;
  return {
    line: axis.axisLine ?? DEFAULTS[axis.kind].axisLine,
    ticks: {
      ...((axis.tickLine ?? DEFAULTS[axis.kind].tickLine) ? {} : { size: 0 }),
      ...(count !== undefined ? { count } : {}),
      ...(axis.tickMargin !== undefined ? { padding: axis.tickMargin } : {}),
      ...(format ? { format } : {}),
    },
  };
}

const LABEL_TEXT = "sw:label";
const LABEL_Y = "sw:label-y";
const LABEL_SIDE = "sw:label-side";

/** A mark label with every default filled in, and its text for one mark row. */
interface MarkLabel {
  position: ChartLabelPosition;
  offset: number;
  fill: string;
  fontSize: number;
  /** The label text of a mark row, or \`undefined\` when the row has no value to show. */
  text(row: MarkRow): string | undefined;
}

/** The label of a mark part, or \`undefined\` when the part draws none. */
function markLabel(
  part: ChartBarPart | ChartLinePart | ChartAreaPart | ChartPiePart,
  config: ChartConfig,
): MarkLabel | undefined {
  const label = part.label ?? DEFAULTS[part.kind].label;
  if (!label) return undefined;
  const style: ChartMarkLabelStyle = label === true ? {} : label;
  const defaults = part.kind === "pie" ? LABEL_DEFAULTS.pie : LABEL_DEFAULTS.cartesian;
  const format = resolveTickFormatter(
    style.formatter,
    `${PART_NAMES[part.kind]} label formatter`,
    config,
  );
  return {
    position: style.position ?? defaults.position,
    offset: style.offset ?? defaults.offset,
    fill: style.fill ?? LABEL_DEFAULTS.fill,
    fontSize: style.fontSize ?? LABEL_DEFAULTS.fontSize,
    text: (row) => {
      const value = style.dataKey === undefined ? row[VALUE] : row[ROW][style.dataKey];
      if (value == null || value === "") return undefined;
      return format ? format(value) : valueText(value);
    },
  };
}

/**
 * The vertical gap between a mark and the middle of its label text in pixels: the offset, then
 * the distance from the edge of the text to its middle line.
 */
const labelGap = (label: MarkLabel) => label.offset + label.fontSize * 0.35;

/**
 * Label rows for bars: the label text, the label y value and the side of the bar that the label
 * sits on, from each bar's base \`y1\` and end \`y2\`.
 */
function barLabelRows(
  rows: readonly Row[],
  label: MarkLabel,
  bounds: (row: Row) => { y1: number; y2: number } | undefined,
): Row[] {
  const result: Row[] = [];
  for (const row of rows) {
    const content = label.text(row as MarkRow);
    const bound = bounds(row);
    if (content === undefined || !bound) continue;
    const { y1, y2 } = bound;
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
    const up = y2 >= y1;
    const [y, side] =
      label.position === "top"
        ? [Math.max(y1, y2), -1]
        : label.position === "outside"
          ? [y2, up ? -1 : 1]
          : label.position === "insideStart"
            ? [y1, up ? -1 : 1]
            : [(y1 + y2) / 2, 0];
    result.push({ ...row, [LABEL_TEXT]: content, [LABEL_Y]: y, [LABEL_SIDE]: side });
  }
  return result;
}

/** Label rows for the points of a line or an area, from the point y of each row. */
function pointLabelRows(rows: readonly Row[], label: MarkLabel, y: (row: Row) => unknown): Row[] {
  const side = label.position === "top" || label.position === "outside" ? -1 : 0;
  const result: Row[] = [];
  for (const row of rows) {
    const content = label.text(row as MarkRow);
    const value = Number(y(row));
    if (content === undefined || !Number.isFinite(value)) continue;
    result.push({ ...row, [LABEL_TEXT]: content, [LABEL_Y]: value, [LABEL_SIDE]: side });
  }
  return result;
}

/**
 * One decorative text mark for the label rows of one part. It is decorative, so the marks keep
 * focus and the tooltip lists each value once.
 */
function labelMark(
  id: string,
  rows: readonly Row[],
  label: MarkLabel,
  options: { xScale?: string; point?: boolean } = {},
) {
  const { xScale, point } = options;
  // insideLeft and right start the text right of a point. A bar keeps its labels centered.
  const start = !!point && isStartPosition(label);
  return decorative(
    text(rows, {
      id,
      x: X,
      y: LABEL_Y,
      text: LABEL_TEXT,
      key: ID,
      ...(xScale ? { xScale } : {}),
      fill: label.fill,
      fontSize: label.fontSize,
      ...(start ? { anchor: "start", dx: label.offset } : {}),
      dy: (row: Row) => row[LABEL_SIDE] * labelGap(label),
    } as any),
  );
}

const isStartPosition = (label: MarkLabel) =>
  label.position === "insideLeft" || label.position === "right";

/** The text of the first and last x-axis tick labels, or nothing when the chart draws no x-axis. */
function endTicks(
  axis: false | { ticks: { format?: (value: unknown) => string } },
  categories: readonly ChartValue[],
): { first?: string; last?: string } {
  if (!axis || !categories.length) return {};
  const format = axis.ticks.format ?? ((value: unknown) => valueText(value));
  return { first: format(categories[0]), last: format(categories.at(-1)) };
}

/** The font size of the axis tick labels, for the room that an end tick label needs. */
const TICK_FONT_SIZE = 12;

/** The longest label text, in characters, for a size estimate that needs no text measurement. */
const longestLabel = (rows: readonly Row[]) =>
  Math.max(0, ...rows.map((row) => String(row[LABEL_TEXT]).length));

/** An estimate of the width of a label text in pixels, from its length and font size. */
const labelWidth = (characters: number, fontSize: number) => characters * fontSize * 0.6;

/**
 * The free end of each bar, by mark row id: \`top\` for a bar that grows up from its base and
 * \`bottom\` for a bar that grows down. The bounds run from the base \`y1\` to the free end \`y2\`.
 * A bar with no height has no free end.
 */
function freeEnds(
  rows: readonly Row[],
  bounds: (row: Row) => { y1: number; y2: number } | undefined,
): Map<unknown, "top" | "bottom"> {
  const ends = new Map<unknown, "top" | "bottom">();
  for (const row of rows) {
    const bound = bounds(row);
    if (!bound) continue;
    if (bound.y2 > bound.y1) ends.set(row[ID], "top");
    else if (bound.y2 < bound.y1) ends.set(row[ID], "bottom");
  }
  return ends;
}

/**
 * The end that a number radius rounds on each bar, by mark row id, as the TanStack `{ end }` radius
 * rounds it: the free end. In a stack, only the outer bar on each side of the baseline rounds.
 */
function radiusEnds(
  rows: readonly Row[],
  free: ReadonlyMap<unknown, "top" | "bottom">,
  stacked: boolean,
): Map<unknown, "top" | "bottom"> {
  if (!stacked) return new Map(free);
  const ends = new Map<unknown, "top" | "bottom">();
  const outer = new Map<string, unknown>();
  for (const row of rows) {
    const end = free.get(row[ID]);
    // Rows come in series order, so the last row on a side is the outer bar.
    if (end) outer.set(`${valueText(row[X])}\u0000${end}`, row[ID]);
  }
  for (const [key, id] of outer) ends.set(id, key.endsWith("top") ? "top" : "bottom");
  return ends;
}

/**
 * Four corner radii for one bar. A number rounds the end that `radiusEnds` gives, as it does
 * without tuples. A tuple sets each corner as written on a bar that grows up. Recharts draws a bar
 * that grows down from its free end, so on that bar the tuple turns over:
 * `[topLeft, topRight, bottomRight, bottomLeft]` becomes `[bottomLeft, bottomRight, topRight,
 * topLeft]`.
 */
function cornerRadii(
  radius: number | ChartBarCornerRadii,
  end: "top" | "bottom" | undefined,
  free: "top" | "bottom" | undefined,
): ChartBarCornerRadii {
  if (typeof radius !== "number") {
    const [topLeft, topRight, bottomRight, bottomLeft] = radius;
    return free === "bottom" ? [bottomLeft, bottomRight, topRight, topLeft] : radius;
  }
  if (end === "top") return [radius, radius, 0, 0];
  return end === "bottom" ? [0, 0, radius, radius] : [0, 0, 0, 0];
}

/**
 * Plot margins that keep labels inside the chart, as shadcn adds \`margin\` for its label examples.
 * A label above a mark needs room at the top. The first and last labels of a line chart sit on the
 * plot edges, because its x scale has no padding, so they need room at the sides too. The left
 * side gets room only without a y-axis, which has its own room. A margin that the chart sets
 * replaces the automatic one, so a side keeps room for half of its end tick label, as the
 * automatic margin does. A side that no label needs keeps its automatic margin. The width of a
 * text is an estimate from its length, so the server and the browser draw the same SVG.
 */
function labelMargin(
  entries: readonly { label: MarkLabel; rows: Row[]; point: boolean }[],
  options: { edges: boolean; left: boolean; ticks: { first?: string; last?: string } },
): { margin?: Record<string, number> } {
  const margin: Record<string, number> = {};
  const room = (side: string, value: number) => {
    margin[side] = Math.max(margin[side] ?? 0, Math.ceil(value) + 2);
  };
  for (const { label, rows, point } of entries) {
    const above = label.position === "top" || label.position === "outside";
    if (above && rows.some((row) => row[LABEL_SIDE] < 0))
      room("top", label.offset + label.fontSize);
    if (!options.edges || !point) continue;
    const width = labelWidth(longestLabel(rows), label.fontSize);
    const tick = (text: string | undefined) => labelWidth(text?.length ?? 0, TICK_FONT_SIZE) / 2;
    room(
      "right",
      Math.max(isStartPosition(label) ? label.offset + width : width / 2, tick(options.ticks.last)),
    );
    if (options.left && !isStartPosition(label))
      room("left", Math.max(width / 2, tick(options.ticks.first)));
  }
  return Object.keys(margin).length ? { margin } : {};
}

/**
 * The room in pixels that an outside label below a bar that grows down needs: its offset and its
 * text. Zero when no such label draws.
 */
function roomBelowBars(entries: readonly { label: MarkLabel; rows: Row[]; point: boolean }[]) {
  let room = 0;
  for (const { label, rows, point } of entries)
    if (!point && label.position === "outside" && rows.some((row) => row[LABEL_SIDE] > 0))
      room = Math.max(room, Math.ceil(label.offset + label.fontSize) + 2);
  return room;
}

/**
 * A linear y scale factory that keeps \`room\` pixels free below the lowest value of the plot, so an
 * outside label below a negative bar sits inside the plot. The x-axis and its tick labels then draw
 * below the label. The ticks come from the data domain, so the axis keeps its tick values, and the
 * scale only grows its lower end when the plot height is known.
 */
function roomBelowScale(room: number) {
  const wrap = (inner: any, initial: readonly number[]): any => {
    let content = [...initial];
    const scale: any = (value: number) => inner(value);
    const extend = () => {
      const [low, high] = content as [number, number];
      const [start, end] = inner.range() as [number, number];
      const height = Math.abs(end - start);
      if (height <= room || !(high > low)) return;
      inner.domain([low - (room * (high - low)) / (height - room), high]);
    };
    const data = () => inner.copy().domain(content);
    scale.domain = (...args: [(readonly number[])?]) => {
      if (!args.length) return inner.domain();
      content = [...args[0]!];
      inner.domain(content);
      extend();
      return scale;
    };
    scale.range = (...args: [(readonly number[])?]) => {
      if (!args.length) return inner.range();
      inner.range(args[0]);
      inner.domain(content);
      extend();
      return scale;
    };
    scale.nice = (count?: number) => {
      content = data().nice(count).domain();
      inner.domain(content);
      extend();
      return scale;
    };
    // The copy keeps the room, so it maps each value to the same pixel as this scale.
    scale.copy = () => wrap(inner.copy(), content);
    scale.ticks = (count?: number) => data().ticks(count);
    scale.tickFormat = (count?: number, specifier?: string) => data().tickFormat(count, specifier);
    scale.invert = (value: number) => inner.invert(value);
    return scale;
  };
  return () => {
    const inner = scaleLinear();
    return wrap(inner, inner.domain());
  };
}

/** The category padding of the bar x scale, and the padding between grouped bars. */
const BAND_PADDING = 0.28;
const GROUP_PADDING = 0.15;

/**
 * A point scale whose points sit at the centers of one grouped bar slot, one point per category.
 * The band scale and the group layout both center their bands, so each slot center is a fixed
 * share of the plot width. A point scale with the same step and a matching \`align\` gives it at
 * any width. It is a scale instance, so it keeps every category when a series has no label in a
 * category. A scale factory would take its domain from the label rows.
 */
function slotScale(categories: readonly ChartValue[], slot: number, slots: number) {
  const p = BAND_PADDING;
  const share = (1 - p) / (slots + GROUP_PADDING);
  const align = (p + share * (GROUP_PADDING + slot + (1 - GROUP_PADDING) / 2)) / (1 + p);
  return {
    channel: "x",
    axis: false,
    scale: scalePoint<any>()
      .domain(categories)
      .padding((1 + p) / 2)
      .align(align),
  };
}

/**
 * The label marks of the bars, and the named x scales that place the labels of grouped bars. Each
 * label follows its bar: the stack bounds of a stack, or zero to the value of a plain bar.
 */
function barLabels(
  ctx: ChartContext<Row>,
  colors: SeriesColors,
  bars: readonly ChartBarPart[],
  xKey: string,
  offset: { offset?: "normalize" },
  categories: readonly ChartValue[],
): { marks: any[]; scales: Record<string, unknown>; labels: { label: MarkLabel; rows: Row[] }[] } {
  const labeled = bars.flatMap((part) => {
    const label = markLabel(part, ctx.config);
    return label ? [{ part, label }] : [];
  });
  if (!labeled.length) return { marks: [], scales: {}, labels: [] };
  const groups = stackGroups(bars);
  const stacked = groups.length === 1 && bars.length > 1;
  const mixed =
    !stacked && groups.some((members) => members.length > 1 || normalizes(members, offset));
  const rows = markRows(
    ctx,
    colors,
    bars.map((part) => part.dataKey),
    xKey,
  );
  const bounds = new Map<unknown, { y1: number; y2: number }>();
  const slots = new Map<string, number>();
  if (stacked) for (const [id, bound] of stackBounds(rows, offset)) bounds.set(id, bound);
  else
    groups.forEach((members, slot) => {
      const keys = new Set(members.map((part) => part.dataKey));
      for (const key of keys) slots.set(key, slot);
      const stack = rows.filter((row) => keys.has(row[SERIES]));
      if (mixed)
        for (const [id, bound] of stackBounds(stack, normalizes(members, offset) ? offset : {}))
          bounds.set(id, bound);
      else for (const row of stack) bounds.set(row[ID], { y1: 0, y2: Number(row[VALUE]) });
    });
  // The group layout lays out the slots of the visible rows, in row order.
  const slotOf = (series: string) => (mixed ? slots.get(series) : series);
  const domain = unique(rows.map((row) => slotOf(row[SERIES])));
  const marks: any[] = [];
  const scales: Record<string, unknown> = {};
  const labels: { label: MarkLabel; rows: Row[] }[] = [];
  labeled.forEach(({ part, label }, index) => {
    const own = barLabelRows(
      rows.filter((row) => row[SERIES] === part.dataKey),
      label,
      (row) => bounds.get(row[ID]),
    );
    if (!own.length) return;
    labels.push({ label, rows: own });
    if (stacked) {
      marks.push(labelMark(markId("bar-labels", index), own, label));
      return;
    }
    const slot = domain.indexOf(slotOf(part.dataKey));
    const name = `sw-label-x-${slot}`;
    scales[name] ??= slotScale(categories, slot, domain.length);
    marks.push(labelMark(markId("bar-labels", index), own, label, { xScale: name }));
  });
  return { marks, scales, labels };
}

function barMark(
  ctx: ChartContext<Row>,
  colors: SeriesColors,
  bars: readonly ChartBarPart[],
  xKey: string,
  offset: { offset?: "normalize" },
) {
  const groups = stackGroups(bars);
  const stacked = groups.length === 1 && bars.length > 1;
  // A stack beside other bars takes one grouped slot, as Recharts places it. A lone named bar that
  // stacks to 100% takes the same path, so it keeps the slot and width of a plain bar.
  const mixed =
    !stacked && groups.some((members) => members.length > 1 || normalizes(members, offset));
  const radius = bySeries<ChartBarPart, "radius", number | ChartBarCornerRadii>(
    bars,
    "radius",
    () => DEFAULTS.bar.radius as number,
  );
  // Four corner radii set each corner of each bar, as Recharts. A number among them rounds the
  // same end that it rounds without corner radii.
  const corners = bars.some((part) => Array.isArray(part.radius));
  // A radius of 0 is the default: the bars stay plain rectangles.
  const shared = unique(bars.map((part) => part.radius ?? (DEFAULTS.bar.radius as number)));
  const fill = bySeries(bars, "fill", colors.fill);
  let rows = markRows(
    ctx,
    colors,
    bars.map((part) => part.dataKey),
    xKey,
  );
  if (mixed) {
    const slots = new Map<string, number>();
    const bounds = new Map<unknown, { y1: number; y2: number }>();
    groups.forEach((members, slot) => {
      const keys = new Set(members.map((part) => part.dataKey));
      for (const key of keys) slots.set(key, slot);
      const stack = rows.filter((row) => keys.has(row[SERIES]));
      // A bar without a stackId keeps its raw height. A named stack expands.
      for (const [id, bound] of stackBounds(stack, normalizes(members, offset) ? offset : {}))
        bounds.set(id, bound);
    });
    rows = rows.map((row) => ({
      ...row,
      [SLOT]: slots.get(row[SERIES]),
      [Y1]: bounds.get(row[ID])?.y1,
      [Y2]: bounds.get(row[ID])?.y2,
    }));
  }
  // The free end of each bar: from the stack bounds of a stack, or from zero to the value.
  const free = corners
    ? freeEnds(
        rows,
        mixed
          ? (row) => ({ y1: row[Y1], y2: row[Y2] })
          : stacked
            ? (
                (bounds) => (row: Row) =>
                  bounds.get(row[ID])
              )(stackBounds(rows, offset))
            : (row) => ({ y1: 0, y2: Number(row[VALUE]) }),
      )
    : undefined;
  const ends = free ? radiusEnds(rows, free, stacked) : undefined;
  return barY(rows, {
    id: "bars",
    x: X,
    y: VALUE,
    color: SERIES,
    key: ID,
    ...(mixed ? { y1: Y1, y2: Y2, z: SLOT } : {}),
    ...(stacked
      ? offset.offset
        ? { layout: stack(offset) }
        : {}
      : { layout: group({ padding: GROUP_PADDING }) }),
    ...(corners
      ? {
          radius: (row: Row) => cornerRadii(radius!(row), ends!.get(row[ID]), free!.get(row[ID])),
        }
      : shared.length === 1
        ? shared[0] === 0
          ? {}
          : { radius: { end: shared[0] } }
        : { radius: { end: radius! } }),
    maxThickness: 52,
    ...(fill ? { fill } : {}),
  } as any);
}

/** A gradient coordinate or stop offset as a number: `"5%"` is 0.05, and `"0.5"` is 0.5. */
function gradientNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return value.trim().endsWith("%") ? number / 100 : number;
}

/**
 * The TanStack chart-level gradients of a spec, or nothing when it has no ChartLinearGradient. The
 * coordinates are always set, because TanStack defaults to a gradient from bottom to top and SVG
 * defaults to one from left to right.
 */
function chartGradients(spec: ChartSpec): { gradients?: unknown[] } {
  const parts = partsOf(spec, "linearGradient");
  if (!parts.length) return {};
  return {
    gradients: parts.map((part) => {
      if (typeof part.id !== "string" || !part.id)
        throw new TypeError('A ChartLinearGradient needs an id, such as id="fillDesktop".');
      const stops = Array.isArray(part.stops) ? part.stops : [];
      return {
        id: gradientKey(part.id),
        x1: gradientNumber(part.x1, DEFAULTS.linearGradient.x1),
        y1: gradientNumber(part.y1, DEFAULTS.linearGradient.y1),
        x2: gradientNumber(part.x2, DEFAULTS.linearGradient.x2),
        y2: gradientNumber(part.y2, DEFAULTS.linearGradient.y2),
        stops: stops
          .filter((stop) => !!stop && typeof stop === "object")
          .map((stop) => ({
            offset: gradientNumber(stop.offset, 0),
            color: stop.stopColor,
            ...(stop.stopOpacity !== undefined ? { opacity: stop.stopOpacity } : {}),
          })),
      };
    }),
  };
}

/**
 * The fill opacity of an area. A fill that names a ChartLinearGradient of the same spec, without its
 * own opacity, takes the Recharts area default, 0.6, so the gradient stops look as they do in
 * shadcn. Other areas, also those that fill from an SVG gradient or pattern outside the chart,
 * default to 0.22.
 */
function areaFillOpacity(part: ChartAreaPart, gradients: ReadonlySet<string>): number {
  if (part.fillOpacity !== undefined) return part.fillOpacity;
  const id = typeof part.fill === "string" ? PAINT_URL.exec(part.fill.trim())?.[1] : undefined;
  return id !== undefined && gradients.has(id) ? GRADIENT_FILL_OPACITY : DEFAULTS.area.fillOpacity;
}

/** A paint that names an SVG element, such as `"url(#fillDesktop)"`, with the id in group 1. */
const PAINT_URL = /^url\(#([^)]+)\)$/;

/**
 * The gradient id that the spec gives TanStack. TanStack writes the SVG id as
 * `<chart id>-<gradient id>`, and a chart id can hold hyphens. This id has no hyphen, so the last
 * hyphen of the SVG id splits the pair, and two charts on one page never share a gradient id. An
 * underscore becomes `__` and a hyphen `_h`. An id of letters and digits stays as it is.
 */
const gradientKey = (id: string) => id.replaceAll("_", "__").replaceAll("-", "_h");

/** The TanStack ids of the ChartLinearGradient parts of a spec. */
const gradientKeys = (spec: ChartSpec): Set<string> =>
  new Set(
    partsOf(spec, "linearGradient")
      .map((part) => part.id)
      .filter((id): id is string => typeof id === "string" && id !== "")
      .map(gradientKey),
  );

const PAINT_PROPS = new Set(["fill", "stroke"]);

/**
 * The spec with each `fill` or `stroke` that names a ChartLinearGradient of the spec changed to the
 * TanStack id of that gradient, also in nested objects such as `dot` and `label`. Other paints stay
 * as they are, so a URL to an SVG element outside the chart keeps working. A spec without
 * gradients is the same object.
 */
function scopeGradientPaints(spec: ChartSpec): ChartSpec {
  const ids = new Set(
    partsOf(spec, "linearGradient")
      .map((part) => part.id)
      .filter((id): id is string => typeof id === "string" && id !== ""),
  );
  if (!ids.size) return spec;
  const scope = (value: unknown, depth: number): unknown => {
    if (depth < 0 || !value || typeof value !== "object" || Array.isArray(value)) return value;
    if (Object.getPrototypeOf(value) !== Object.prototype) return value;
    return Object.fromEntries(
      Object.entries(value).map(([name, entry]) => {
        if (PAINT_PROPS.has(name) && typeof entry === "string") {
          const id = PAINT_URL.exec(entry.trim())?.[1];
          if (id !== undefined && ids.has(id)) return [name, `url(#${gradientKey(id)})`];
        }
        return [name, scope(entry, depth - 1)];
      }),
    );
  };
  return {
    ...spec,
    parts: spec.parts.map((part) =>
      part.kind === "linearGradient" ? part : (scope(part, 2) as ChartPart),
    ),
  };
}

function cartesianChart(
  spec: ChartSpec,
  ctx: ChartContext<Row>,
): DomChartDefinition<any, any, any> {
  const xAxis = guideOf(spec, "xAxis");
  const xKey = categoryKeyOf(spec, ctx.data, ctx.config);
  if (!xKey) throw new TypeError(`A ChartBar, ChartLine or ChartArea chart needs ${CATEGORY_GAP}.`);
  const yAxis = guideOf(spec, "yAxis");
  const grid = guideOf(spec, "grid");
  // The full category list, so the axis keeps every category when series hide.
  const categories = unique(ctx.data.map((row) => row[xKey] as ChartValue));
  const bars = partsOf(spec, "bar");
  const areas = partsOf(spec, "area");
  const lines = partsOf(spec, "line");
  const marksInOrder = spec.parts.filter(isMark);
  const colors = seriesColors(
    ctx,
    (key) => PART_NAMES[marksInOrder.find((part) => part.dataKey === key)!.kind],
    marksInOrder.map((part) => part.dataKey),
  );
  const channels = { x: X, y: VALUE, color: SERIES, key: ID } as const;
  const marks: any[] = [];
  const overlays: any[] = [];
  // Labels draw over every mark. Each entry keeps its rows for the room that the labels need.
  const labelMarks: any[] = [];
  const labelRows: { label: MarkLabel; rows: Row[]; point: boolean }[] = [];
  let labelScales: Record<string, unknown> = {};

  const offset = stackOffsetOf(spec);
  const gradients = gradientKeys(spec);

  if (bars.length) {
    if (spec.cursor ?? CHART_DEFAULTS.cursor)
      marks.push(
        crosshair({
          id: "category-hover",
          x: { band: { fill: "var(--muted)", fillOpacity: 1 } },
          y: false,
          marker: false,
        }),
      );
    marks.push(barMark(ctx, colors, bars, xKey, offset));
    const labels = barLabels(ctx, colors, bars, xKey, offset, categories);
    labelMarks.push(...labels.marks);
    labelScales = labels.scales;
    labelRows.push(...labels.labels.map((entry) => ({ ...entry, point: false })));
  }

  if (areas.length) {
    const dots: Row[] = [];
    let index = 0;
    for (const members of stackGroups(areas)) {
      const rows = markRows(
        ctx,
        colors,
        members.map((part) => part.dataKey),
        xKey,
      );
      const styles = styleGroups(
        members.map((part) => ({ ...part, fillOpacity: areaFillOpacity(part, gradients) })),
        ["type", "fillOpacity", "strokeWidth"],
      );
      // One style stacks in one mark. Parts with their own styles get their own marks over stack
      // bounds that are computed once.
      // An area without a stackId keeps its raw values. A named stack expands.
      const groupOffset = normalizes(members, offset) ? offset : {};
      const stacked = stackRowsY(rows, { x: X, y: VALUE, z: SERIES, ...groupOffset }) as Row[];
      const bounds =
        styles.length > 1
          ? new Map(stacked.map((row) => [row[ID], { y1: row.y1, y2: row.y2 }]))
          : undefined;
      for (const style of styles) {
        const [first] = style as [ChartAreaPart];
        const keys = new Set(style.map((part) => part.dataKey));
        const fill = bySeries(style, "fill", colors.fill);
        const curve = CURVES[first.type ?? DEFAULTS.area.type];
        const own = bounds
          ? rows
              .filter((row) => keys.has(row[SERIES]))
              .map((row) => ({
                ...row,
                [Y1]: bounds.get(row[ID])?.y1,
                [Y2]: bounds.get(row[ID])?.y2,
              }))
          : rows;
        marks.push(
          areaY(own, {
            id: markId("areas", index),
            ...channels,
            ...(bounds
              ? { y1: Y1, y2: Y2 }
              : groupOffset.offset
                ? { layout: stack(groupOffset) }
                : {}),
            ...(curve ? { curve } : {}),
            fillOpacity: first.fillOpacity,
            strokeWidth: first.strokeWidth ?? DEFAULTS.area.strokeWidth,
            stroke:
              bySeries(style, "stroke", colors.stroke) ??
              ((row: Row) => colors.stroke(row[SERIES])),
            ...(fill ? { fill } : {}),
          } as any),
        );
        index += 1;
      }
      const active = new Set(
        members
          .filter((part) => part.activeDot ?? DEFAULTS.area.activeDot)
          .map((part) => part.dataKey),
      );
      if (active.size) dots.push(...stacked.filter((row) => active.has(String(row[SERIES]))));
      // A label sits at the top of its area, the stack bound y2.
      for (const part of members) {
        const label = markLabel(part, ctx.config);
        if (!label) continue;
        const rows = pointLabelRows(
          stacked.filter((row) => row[SERIES] === part.dataKey),
          label,
          (row) => row.y2,
        );
        if (!rows.length) continue;
        labelMarks.push(
          labelMark(markId("area-labels", labelMarks.length), rows, label, { point: true }),
        );
        labelRows.push({ label, rows, point: true });
      }
    }
    if (areas.some((part) => part.activeDot ?? DEFAULTS.area.activeDot))
      overlays.push(
        whenFocused(
          dot(dots, {
            id: "active-values",
            x: X,
            y: "y2",
            z: SERIES,
            color: SERIES,
            key: ID,
            r: 4,
            stroke: CARD,
            strokeWidth: 2,
          }),
          { match: "x" },
        ),
      );
  }

  if (lines.length) {
    styleGroups(lines, ["type", "strokeWidth"]).forEach((members, index) => {
      const [first] = members as [ChartLinePart];
      const rows = markRows(
        ctx,
        colors,
        members.map((part) => part.dataKey),
        xKey,
      );
      const stroke = bySeries(members, "stroke", colors.fill);
      const curve = CURVES[first.type ?? DEFAULTS.line.type];
      marks.push(
        lineY(rows, {
          ...channels,
          id: markId("lines", index),
          ...(curve ? { curve } : {}),
          strokeWidth: first.strokeWidth ?? DEFAULTS.line.strokeWidth,
          ...(stroke ? { stroke } : {}),
        }),
      );
    });
    for (const part of lines) {
      const label = markLabel(part, ctx.config);
      if (!label) continue;
      // The line skips a value that is not a finite number, so its label skips it too.
      const rows = pointLabelRows(
        markRows(ctx, colors, [part.dataKey], xKey).filter(
          (row) => typeof row[VALUE] === "number" && Number.isFinite(row[VALUE]),
        ),
        label,
        (row) => row[VALUE],
      );
      if (!rows.length) continue;
      labelMarks.push(
        labelMark(markId("line-labels", labelMarks.length), rows, label, { point: true }),
      );
      labelRows.push({ label, rows, point: true });
    }
    // Decorative, so the line keeps focus and the tooltip lists each value once.
    dotGroups(lines, "dot", DEFAULTS.line.dot).forEach(({ keys, style }, index) =>
      marks.push(
        decorative(
          dot(markRows(ctx, colors, keys, xKey), {
            ...channels,
            id: markId("line-dots", index),
            r: 3,
            stroke: CARD,
            strokeWidth: 1,
            ...style,
          }),
        ),
      ),
    );
    dotGroups(lines, "activeDot", DEFAULTS.line.activeDot).forEach(({ keys, style }, index) =>
      overlays.push(
        whenFocused(
          dot(markRows(ctx, colors, keys, xKey), {
            ...channels,
            id: markId("active-dots", index),
            r: 4,
            ...style,
          }),
          { match: "x" },
        ),
      ),
    );
  }

  const x = {
    scale: bars.length
      ? () => scaleBand<any>().domain(categories).padding(BAND_PADDING)
      : () =>
          scalePoint<any>()
            .domain(categories)
            .padding(areas.length ? 0.3 : 0),
    ...(grid && (grid.vertical ?? DEFAULTS.grid.vertical) ? { grid: { stroke: BORDER } } : {}),
    // Date categories without a formatter show their ISO text, so the text does not depend on the
    // host time zone. Without a ChartXAxis, the chart draws no x-axis, as Recharts.
    axis:
      !xAxis?.dataKey || (xAxis.hide ?? DEFAULTS.xAxis.hide)
        ? (false as const)
        : axisPresentation(
            xAxis,
            ctx.config,
            undefined,
            categories.some((value) => value instanceof Date) ? valueText : undefined,
          ),
  };
  // When every y value stacks to 100%, the axis is [0, 1]. A nice inferred domain would round a sum
  // slightly above 1 in floating point up to 1.2.
  const stackedMarks = [...bars, ...areas];
  const expanded =
    !lines.length &&
    stackedMarks.every((part) => normalizes([part], offset)) &&
    ctx.data.every((row) => stackedMarks.every((part) => !(Number(row[part.dataKey]) < 0)));
  // An outside label below a negative bar keeps its room inside the plot, above the x-axis.
  const room = roomBelowBars(labelRows);
  const y = {
    scale: expanded ? scaleLinear().domain([0, 1]) : room > 0 ? roomBelowScale(room) : scaleLinear,
    nice: true,
    ...(grid && (grid.horizontal ?? DEFAULTS.grid.horizontal) ? { grid: { stroke: BORDER } } : {}),
    axis:
      yAxis && !(yAxis.hide ?? DEFAULTS.yAxis.hide)
        ? axisPresentation(yAxis, ctx.config, yAxis.tickCount ?? DEFAULTS.yAxis.tickCount)
        : (false as const),
  };
  return defineChart(
    {
      marks: [...marks, ...overlays, ...labelMarks],
      scales: { x, y, ...labelScales },
      ...chartGradients(spec),
      ...labelMargin(labelRows, {
        edges: !bars.length && !areas.length,
        left: !y.axis,
        ticks: endTicks(x.axis, categories),
      }),
      color: colors.color,
      theme: ctx.theme,
    } as any,
    {
      ...baseInteraction(),
      tooltip: ctx.tooltip({ labelKey: X, nameKey: SERIES, valueKey: VALUE }),
    },
  ) as unknown as DomChartDefinition<any, any, any>;
}

/** The share of the available radius that a percent radius gives. */
function percentShare(value: `${number}%`): number {
  return Number.parseFloat(value) / 100;
}

/** A radius as a polar length: a number is pixels, a percent is a share of `available`. */
function radiusLength(value: ChartRadius, available: (layout: PolarLayoutContext) => number) {
  return typeof value === "string"
    ? (layout: PolarLayoutContext) => (available(layout) * Number.parseFloat(value)) / 100
    : () => value;
}

/** True when a radius draws a hole: a number or percent above zero. */
function hasHole(value: ChartRadius | undefined): boolean {
  if (value === undefined) return false;
  return (typeof value === "string" ? Number.parseFloat(value) : value) > 0;
}

function pieChart(spec: ChartSpec, ctx: ChartContext<Row>): DomChartDefinition<any, any, any> {
  const part = partsOf(spec, "pie")[0]!;
  const { dataKey, nameKey } = part;
  const labels = partsOf(spec, "label");
  const colors = seriesColors(
    ctx,
    PART_NAMES.pie,
    ctx.data.map((row) => row[nameKey]),
  );
  const data = ctx.data
    .filter((row) => colors.shows(row[nameKey]))
    .map(
      (row): MarkRow => ({
        [ROW]: row,
        [VALUE]: row[dataKey],
        [SERIES]: row[nameKey],
        [ID]: row[nameKey],
      }),
    );
  const total = data.reduce((sum, row) => sum + (Number(row[VALUE]) || 0), 0);
  const arcs = pie(data, {
    value: VALUE,
    gapAngle: part.paddingAngle === undefined ? 0.025 : (part.paddingAngle * Math.PI) / 180,
  });
  // A percent outer radius scales the polar frame, so `c.radius` below is the outer radius. A
  // pixel outer radius keeps the full frame, so `c.radius` is the available radius.
  const outer = part.outerRadius ?? DEFAULTS.pie.outerRadius;
  const ratio = typeof outer === "string" ? percentShare(outer) : 1;
  const inner = part.innerRadius ?? DEFAULTS.pie.innerRadius;
  const innerRadius =
    typeof inner === "number"
      ? inner
      : (c: { radius: number }) => c.radius * (percentShare(inner) / ratio);
  const label = markLabel(part, ctx.config);
  const labelRows: Row[] = [];
  for (const arc of label ? arcs : []) {
    const content = label!.text(arc as unknown as MarkRow);
    if (content !== undefined) labelRows.push({ ...arc, [LABEL_TEXT]: content });
  }
  const outside = label?.position === "outside" && labelRows.length > 0;
  // Outside labels need room past the outer radius: the offset, then the estimated text width. A
  // percent outer radius shrinks to make that room. A pixel outer radius stays as the user set it.
  const room = outside
    ? label!.offset +
      Math.max(label!.fontSize, labelWidth(longestLabel(labelRows), label!.fontSize))
    : 0;
  const shrinks = outside && typeof outer === "string";
  const frameRatio = shrinks ? 1 : ratio;
  const outerPx = (c: { radius: number }) =>
    typeof outer === "number"
      ? outer
      : shrinks
        ? Math.max(0, Math.min(ratio * c.radius, c.radius - room))
        : c.radius;
  const innerPx = (c: { radius: number }) =>
    typeof inner === "number"
      ? inner
      : shrinks
        ? outerPx(c) * (percentShare(inner) / ratio)
        : c.radius * (percentShare(inner) / ratio);
  const marks: any[] = [
    polar({
      radiusRatio: frameRatio,
      scales: { angle: null, radius: null },
      marks: [
        radialArc(arcs, {
          id: "slices",
          color: SERIES as any,
          key: ID as any,
          ...(shrinks
            ? { outerRadius: outerPx, innerRadius: innerPx }
            : {
                ...(typeof outer === "number" ? { outerRadius: outer } : {}),
                innerRadius,
              }),
          stroke: part.stroke ?? DEFAULTS.pie.stroke,
          strokeWidth: part.strokeWidth ?? DEFAULTS.pie.strokeWidth,
        }),
      ],
    }),
  ];
  // Slice labels sit at the middle angle of each slice: in the middle of the ring, or past the
  // outer radius with a line from the slice, as Recharts draws a pie label.
  if (label && labelRows.length) {
    const middle = (row: Row) => (row.startAngle + row.endAngle) / 2;
    const lines =
      outside && (part.labelLine ?? DEFAULTS.pie.labelLine)
        ? [
            radialRule(labelRows, {
              id: "slice-label-lines",
              key: ID as any,
              angle: middle,
              radius1: 1,
              radius2: 1,
              radius2Offset: label.offset,
              stroke: (row: Row) => colors.fill(row[SERIES]),
              strokeWidth: 1,
            } as any),
          ]
        : [];
    marks.push(
      decorative(
        polar({
          radiusRatio: frameRatio,
          scales: {
            angle: { scale: scaleLinear().domain([0, 2 * Math.PI]) },
            radius: { scale: scaleLinear().domain([0, 1]), range: [innerPx, outerPx] },
          },
          marks: [
            ...lines,
            radialText(labelRows, {
              id: "slice-labels",
              key: ID as any,
              angle: middle,
              radius: outside ? 1 : 0.5,
              ...(outside ? { radiusOffset: label.offset, anchor: "outside" as const } : {}),
              text: LABEL_TEXT,
              fill: label.fill,
              fontSize: label.fontSize,
            } as any),
          ],
        } as any),
      ),
    );
  }
  // Each label is one center line, as shadcn draws the total and a muted line below it.
  if (labels.length) {
    const texts = labels.map((label, index) => {
      const value = label.value;
      const text =
        value === undefined
          ? (row: { total: number }) => row.total.toLocaleString("en-US")
          : () => (typeof value === "number" ? value.toLocaleString("en-US") : String(value));
      const dy = label.dy ?? DEFAULTS.label.dy;
      // At the default weight, the text writes no weight, so the SVG stays as before.
      const fontWeight = label.fontWeight ?? DEFAULTS.label.fontWeight;
      return radialText([{ total }], {
        id: markId("visible-total", index),
        angle: 0,
        radius: 0,
        text,
        fontSize: label.fontSize ?? DEFAULTS.label.fontSize,
        fill: label.fill ?? DEFAULTS.label.fill,
        ...(fontWeight !== DEFAULTS.label.fontWeight ? { fontWeight } : {}),
        ...(dy ? { dy } : {}),
      });
    });
    marks.push(
      decorative(
        polar({
          scales: {
            angle: { scale: scaleLinear().domain([0, 1]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
          },
          marks: texts,
        }),
      ),
    );
  }
  return defineChart(
    {
      marks,
      scales: { x: null, y: null },
      color: colors.color,
      theme: ctx.theme,
      ...chartGradients(spec),
    } as any,
    {
      ...baseInteraction(),
      // The slice name and value make the row. A pie tooltip has no title, as the reference.
      tooltip: ctx.tooltip({ nameKey: SERIES, valueKey: VALUE }),
      focus: undefined,
      maxFocusDistance: 48,
    },
  ) as unknown as DomChartDefinition<any, any, any>;
}

/**
 * The rings of a radar polar grid. `polarRadius` holds ring radii in pixels, as Recharts reads
 * them, so those rings map their values to pixels in place of the radius scale.
 */
function ringGrid(part: ChartPolarGridPart, stroke: string): PolarGuide {
  const options = {
    shape: part.gridType ?? DEFAULTS.polarGrid.gridType,
    ticks: 4,
    stroke,
    strokeWidth: part.strokeWidth ?? DEFAULTS.polarGrid.strokeWidth,
    ...(part.fill !== undefined ? { fill: part.fill } : {}),
    ...(part.fillOpacity !== undefined ? { fillOpacity: part.fillOpacity } : {}),
  };
  if (!part.polarRadius) return radialGrid(options);
  const grid = radialGrid({ ...options, values: [...part.polarRadius] });
  return {
    render: (context) => {
      const { scales } = context.layout;
      const pixels = { ...scales.radius!, map: (value: unknown) => Number(value) };
      return grid.render({
        ...context,
        layout: { ...context.layout, scales: { ...scales, radius: pixels } },
      });
    },
  };
}

function radarChart(spec: ChartSpec, ctx: ChartContext<Row>): DomChartDefinition<any, any, any> {
  const angleAxis = guideOf(spec, "polarAngleAxis");
  if (!angleAxis?.dataKey)
    throw new TypeError(
      "A ChartRadar chart needs a ChartPolarAngleAxis with the category dataKey.",
    );
  const angleKey = angleAxis.dataKey;
  const polarGrid = guideOf(spec, "polarGrid");
  const radars = partsOf(spec, "radar");
  const keys = radars.map((part) => part.dataKey);
  const colors = seriesColors(ctx, PART_NAMES.radar, keys);
  const categories = unique(ctx.data.map((row) => row[angleKey] as ChartValue));
  // The radius domain covers every series, hidden or not, so the rings stay put on a toggle.
  const values = ctx.data.flatMap((row) => keys.map((key) => Number(row[key])));
  const max = Math.max(0, ...values.filter(Number.isFinite));
  const scales = {
    angle: { scale: scalePoint<any>().domain(categories), wrap: true },
    radius: {
      scale: scaleLinear()
        .domain([0, max || 1])
        .nice(),
    },
  };
  const channels = {
    angle: X,
    radius: VALUE,
    z: SERIES,
    color: SERIES,
    key: ID,
  } as const;
  const rows = markRows(ctx, colors, keys, angleKey);
  const of = (members: readonly { dataKey: string }[]) => {
    const set = new Set(members.map((part) => part.dataKey));
    return rows.filter((row) => set.has(String(row[SERIES])));
  };
  const areas: any[] = styleGroups(radars, ["fillOpacity", "strokeWidth"]).map((members, index) => {
    const [first] = members as [ChartRadarPart];
    return radialArea(of(members), {
      ...channels,
      id: markId("radar", index),
      curve: linearClosedCurve,
      fillOpacity: first.fillOpacity ?? DEFAULTS.radar.fillOpacity,
      strokeWidth: first.strokeWidth ?? DEFAULTS.radar.strokeWidth,
      stroke: (row: Row) => colors.stroke(row[SERIES]),
    });
  });
  // Date categories without a formatter show their ISO text, as cartesian categories.
  const format =
    resolveTickFormatter(
      angleAxis.tickFormatter,
      "ChartPolarAngleAxis tickFormatter",
      ctx.config,
    ) ?? (categories.some((value) => value instanceof Date) ? valueText : undefined);
  const gridStroke = polarGrid?.stroke ?? DEFAULTS.polarGrid.stroke;
  const spokes = !!polarGrid && (polarGrid.radialLines ?? DEFAULTS.polarGrid.radialLines);
  const guides = [
    ...(polarGrid ? [ringGrid(polarGrid, gridStroke)] : []),
    angleGrid({
      ...(format ? { format } : {}),
      // The angle axis draws the labels, and the polar grid draws the spokes.
      stroke: spokes ? gridStroke : "none",
      strokeWidth: polarGrid?.strokeWidth ?? DEFAULTS.polarGrid.strokeWidth,
    }),
  ];
  const marks: any[] = [polar({ radiusRatio: 0.72, scales, marks: areas, guides })];
  const keyed = (keys: readonly string[]) => keys.map((dataKey) => ({ dataKey }));
  // Decorative, so the radar areas keep focus and the tooltip lists each value once.
  dotGroups(radars, "dot", DEFAULTS.radar.dot).forEach(({ keys, style }, index) =>
    marks.push(
      decorative(
        polar({
          radiusRatio: 0.72,
          scales,
          marks: [
            radialDot(of(keyed(keys)), {
              ...channels,
              id: markId("radar-dots", index),
              r: 3,
              ...style,
            }),
          ],
        }),
      ),
    ),
  );
  dotGroups(radars, "activeDot", DEFAULTS.radar.activeDot).forEach(({ keys, style }, index) =>
    marks.push(
      whenFocused(
        polar({
          radiusRatio: 0.72,
          scales,
          marks: [
            radialDot(of(keyed(keys)), {
              ...channels,
              id: markId("active-values", index),
              r: 4,
              stroke: CARD,
              strokeWidth: 2,
              ...style,
            }),
          ],
        }),
        { match: "group" },
      ),
    ),
  );
  return defineChart(
    {
      marks,
      scales: { x: null, y: null },
      color: colors.color,
      theme: ctx.theme,
      ...chartGradients(spec),
    } as any,
    {
      ...baseInteraction(),
      tooltip: ctx.tooltip({ labelKey: X, nameKey: SERIES, valueKey: VALUE }),
      focus: focusGroupAngle,
      maxFocusDistance: 48,
    },
  ) as unknown as DomChartDefinition<any, any, any>;
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
  /** The polar layout of the last render, or `undefined` before the first render. */
  layout: () => PolarLayoutContext | undefined;
  /** Inner and outer ring radius in pixels for a layout. */
  inner: (layout: PolarLayoutContext) => number;
  outer: (layout: PolarLayoutContext) => number;
  /** TanStack angles in radians for the values 0 and `max`. */
  startAngle: number;
  endAngle: number;
  max: number;
  /** The radius band scale. Its range is set from the layout. */
  band: BandScale<string>;
  /** The id of the radial bar mark. Points of other marks, such as a track, do not count. */
  mark: string;
}

/**
 * Focus for radial bars, as Recharts' tooltip on a radial bar chart: inside the chart's ring and
 * angle range, the pointer focuses every bar of the band nearest by radius. Outside that range, it
 * focuses nothing. It reads the polar layout of the last render, so one bar works too.
 */
function focusRadialBand(frame: RadialFocusFrame) {
  const span = frame.endAngle - frame.startAngle;
  const bars = <P extends FocusPoint>(points: readonly P[]) =>
    points.filter((point) => point.markId === frame.mark);
  const band = <P extends FocusPoint>(points: readonly P[], point: P) =>
    bars(points).filter((candidate) => candidate.yValue === point.yValue);
  return {
    resolve<P extends FocusPoint>(points: readonly P[], context: { x: number; y: number }) {
      const layout = frame.layout();
      if (!layout) return [];
      const inner = frame.inner(layout);
      const outer = frame.outer(layout);
      const scale = frame.band.copy().range([inner, outer]);
      const middle = (value: unknown) =>
        (scale(String(value)) ?? Number.NaN) + scale.bandwidth() / 2;
      const dx = context.x - layout.centerX;
      const dy = context.y - layout.centerY;
      const radius = Math.hypot(dx, dy);
      // Half a pixel of slack keeps a pointer on the edge itself inside, despite rounding.
      if (radius < Math.min(inner, outer) - 0.5 || radius > Math.max(inner, outer) + 0.5) return [];
      const turn = (Math.atan2(dx, -dy) - frame.startAngle) * Math.sign(span);
      const full = 2 * Math.PI;
      if (Math.abs(span) < full && ((turn % full) + full) % full > Math.abs(span)) return [];
      let nearest: P | undefined;
      for (const point of bars(points)) {
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

const LOW = "sw:low";
const HIGH = "sw:high";

function radialChart(spec: ChartSpec, ctx: ChartContext<Row>): DomChartDefinition<any, any, any> {
  const part = partsOf(spec, "radialBar")[0]!;
  const { dataKey, nameKey } = part;
  // Band keys are text, so a `Date` name gives its ISO text. The mark row keeps the user's row.
  const name = (row: Row) => valueText(row[nameKey]);
  const colors = seriesColors(ctx, PART_NAMES.radialBar, ctx.data.map(name));
  const rows = ctx.data
    .filter((row) => colors.shows(name(row)))
    .map(
      (row): MarkRow => ({
        [ROW]: row,
        [ID]: `${dataKey}-${name(row)}`,
        [SERIES]: name(row),
        [VALUE]: row[dataKey],
        [LOW]: 0,
        [HIGH]: row[dataKey],
      }),
    );
  const max = Math.max(...rows.map((row) => Number(row[HIGH]) || 0), 1);
  // The render records its polar layout, so the focus knows the real center and radius.
  let layout: PolarLayoutContext | undefined;
  const available = (context: PolarLayoutContext) => {
    layout = context;
    return context.radius;
  };
  const inner = radiusLength(part.innerRadius ?? DEFAULTS.radialBar.innerRadius, available);
  const outer = radiusLength(part.outerRadius ?? DEFAULTS.radialBar.outerRadius, available);
  const band = scaleBand<string>()
    .domain(rows.map((row) => String(row[SERIES])))
    .paddingInner(0.2)
    .paddingOuter(0.1);
  const frame = {
    startAngle: Math.PI / 2,
    endAngle: (-3 * Math.PI) / 2,
    scales: {
      angle: { scale: scaleLinear().domain([0, max]) },
      radius: {
        scale: band,
        range: [
          (context: PolarLayoutContext) => (available(context), inner(context)),
          (context: PolarLayoutContext) => (available(context), outer(context)),
        ] as const,
      },
    },
  };
  const marks: any[] = [];
  if (part.background ?? DEFAULTS.radialBar.background)
    marks.push(
      decorative(
        polar({
          ...frame,
          marks: [
            radialBarAngle(rows, {
              id: "track",
              key: ID,
              angle1: 0,
              angle2: max,
              radius: SERIES,
              fill: "var(--muted)",
            }),
          ],
        }),
      ),
    );
  marks.push(
    polar({
      ...frame,
      marks: [
        radialBarAngle(rows, {
          id: "bars",
          key: ID,
          angle1: LOW,
          angle2: HIGH,
          radius: SERIES,
          color: SERIES,
        }),
      ],
    }),
  );
  return defineChart(
    {
      marks,
      scales: { x: null, y: null },
      color: colors.color,
      theme: ctx.theme,
      ...chartGradients(spec),
    } as any,
    {
      svgAnimation: false,
      focusRing: false,
      maxFocusDistance: 48,
      focus: focusRadialBand({
        layout: () => layout,
        inner,
        outer,
        startAngle: frame.startAngle,
        endAngle: frame.endAngle,
        max,
        band,
        mark: "bars",
      }),
      // The bar name and value make the row. A radial tooltip has no title, as the reference.
      tooltip: ctx.tooltip({ nameKey: SERIES, valueKey: VALUE }),
    },
  ) as unknown as DomChartDefinition<any, any, any>;
}

/**
 * The part that a spec still needs before it can draw, or `undefined` when it has every part: a
 * mark part, the polar angle axis of a radar chart, and a category key for a cartesian chart.
 */
function chartSpecGap(
  spec: ChartSpec | undefined,
  data?: readonly unknown[],
  config?: ChartConfig,
): string | undefined {
  const parts = Array.isArray(spec?.parts) ? spec.parts : [];
  const marks = parts.filter((part) => !!part && typeof part === "object" && isMark(part));
  if (!marks.length)
    return "a mark part such as ChartBar, ChartLine, ChartArea, ChartPie, ChartRadar or ChartRadialBar";
  if (marks.some((part) => part.kind === "radar"))
    return guideOf(spec!, "polarAngleAxis")?.dataKey
      ? undefined
      : "a ChartPolarAngleAxis with the category dataKey";
  if (marks.some((part) => POLAR_KINDS.has(part.kind))) return undefined;
  return categoryKeyOf(spec!, data, config) ? undefined : CATEGORY_GAP;
}

/**
 * True when a spec has the parts that it needs to draw: a mark part, the polar angle axis of a
 * radar chart, and a category key for a cartesian chart. A ChartXAxis names the category key, or
 * the chart finds it in `data`. A framework adapter draws nothing until then, because a part
 * inside a wrapper or an async component registers after the first render. Other spec errors
 * still throw when the chart draws.
 */
export function isChartSpecComplete(
  spec: ChartSpec | undefined,
  data?: readonly unknown[],
  config?: ChartConfig,
): boolean {
  return chartSpecGap(spec, data, config) === undefined;
}

const warnedIncompleteCharts = new Set<string>();

/**
 * Warns once in development about a parts chart that still needs a part after its parts
 * registered. The chart draws when the part registers.
 */
export function warnIncompleteChart(
  id: string,
  spec: ChartSpec | undefined,
  data?: readonly unknown[],
  config?: ChartConfig,
): void {
  const gap = chartSpecGap(spec, data, config);
  if (!gap || !isDevelopment() || warnedIncompleteCharts.has(id)) return;
  warnedIncompleteCharts.add(id);
  // biome-ignore lint/suspicious/noConsole: the development warning names the missing chart part.
  console.warn(`Starwind chart "${id}" draws nothing until it has ${gap}.`);
}

/**
 * Turns a chart spec into a chart factory. The factory builds the same TanStack definition that a
 * hand-written chart module builds, from the chart context's data, config and visible keys.
 */
export function createChartSpecFactory(spec: ChartSpec): ChartFactory<any, any, any, any> {
  const kinds = markKinds(spec);
  const build = kinds.includes("pie")
    ? pieChart
    : kinds.includes("radar")
      ? radarChart
      : kinds.includes("radialBar")
        ? radialChart
        : cartesianChart;
  const scoped = scopeGradientPaints(spec);
  return (ctx) => build(scoped, ctx as ChartContext<Row>);
}

/**
 * The config keys that a legend lists, in config order. A parts chart lists the keys that it
 * draws: the mark `dataKey` values of a cartesian or radar chart, or the `nameKey` values of a pie
 * or radial bar chart in every data row, hidden or not. So a shadcn config key with no color, such
 * as `visitors` on a pie, gets no legend item. Without a spec, or before the spec has a mark, the
 * legend lists every config key.
 */
export function chartLegendKeys(
  spec: ChartSpec | undefined,
  data: readonly unknown[] | undefined,
  config: ChartConfig,
): string[] {
  const keys = Object.keys(config);
  const parts = Array.isArray(spec?.parts) ? spec.parts : [];
  const marks = parts.filter((part) => !!part && typeof part === "object" && isMark(part));
  if (!marks.length) return keys;
  const named = marks.find(
    (part): part is ChartPiePart | ChartRadialBarPart =>
      part.kind === "pie" || part.kind === "radialBar",
  );
  const drawn = new Set<string>();
  if (named) {
    // The same key text that each builder uses: `String` for a pie, ISO text for a radial bar.
    const text = named.kind === "pie" ? String : valueText;
    for (const row of Array.isArray(data) ? data : [])
      if (row && typeof row === "object") drawn.add(text((row as Row)[named.nameKey]));
  } else for (const part of marks) drawn.add(part.dataKey);
  return keys.filter((key) => drawn.has(key));
}

/**
 * Host defaults that a spec chart needs and a factory cannot carry. A radial bar chart is square,
 * as the reference radial chart.
 */
export function chartSpecHost(spec: ChartSpec): { aspectRatio?: number } {
  return markKinds(spec).includes("radialBar") ? { aspectRatio: 1 } : {};
}

function isSameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) =>
      isSameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/**
 * True when two specs hold the same parts in the same order with the same props. Format objects
 * compare by value and functions by identity, so framework adapters can keep one spec object while
 * a parent renders again.
 */
export function isSameChartSpec(a: ChartSpec | undefined, b: ChartSpec | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.parts.length !== b.parts.length) return false;
  const { parts: _a, ...aOptions } = a;
  const { parts: _b, ...bOptions } = b;
  return (
    isSameValue(aOptions, bOptions) &&
    a.parts.every((part, index) => isSameValue(part, b.parts[index]))
  );
}

/**
 * Builds a chart spec from its parts and chart-level options. Each set holds the options of one
 * part, in order: the Root first, then the chart-level Tooltips in mount order. The first set that
 * names an option decides it, so the first Tooltip, which supplies the tooltip body, decides
 * `cursor`. An undefined value there uses the default and drops, so the default options leave the
 * spec as plain parts. Without parts there is no spec.
 */
export function buildChartSpec(
  parts: readonly ChartPart[],
  ...options: readonly (ChartSpecOptions | undefined)[]
): ChartSpec | undefined {
  if (!parts.length) return undefined;
  const spec: Record<string, unknown> = { parts };
  const decided = new Set<string>();
  for (const set of options)
    for (const [name, value] of Object.entries(set ?? {})) {
      if (decided.has(name)) continue;
      decided.add(name);
      if (value !== undefined) spec[name] = value;
    }
  return spec as unknown as ChartSpec;
}

const warnedEmptyCharts = new Set<string>();

/**
 * Warns once in development about a chart root with no chart parts, no chart and no definition. The
 * chart renders nothing.
 */
export function warnEmptyChart(id: string): void {
  if (!isDevelopment() || warnedEmptyCharts.has(id)) return;
  warnedEmptyCharts.add(id);
  // biome-ignore lint/suspicious/noConsole: the development warning names the missing chart parts.
  console.warn(
    `Starwind chart "${id}" renders nothing because it has no chart parts, chart or definition. Add a mark part such as ChartBar, or pass chart or definition.`,
  );
}
