/**
 * The value that the chart spec builder uses for each part prop that a part leaves out, by part
 * kind. The Runtime Adapter Contract repeats these values as prop defaults, and a generator test
 * keeps the two in step. A prop without an entry has no single default value. The module imports
 * nothing, so generator scripts can read it. `spec.ts` checks it against the part types.
 */
export const CHART_PART_DEFAULTS = {
  bar: { radius: 0, label: false },
  line: { type: "natural", strokeWidth: 2, dot: false, activeDot: true, label: false },
  area: { type: "monotone", fillOpacity: 0.22, strokeWidth: 2, activeDot: true, label: false },
  pie: {
    innerRadius: 0,
    outerRadius: "90%",
    stroke: "var(--card)",
    strokeWidth: 2,
    label: false,
    labelLine: true,
  },
  radar: { fillOpacity: 0.18, strokeWidth: 2, dot: false, activeDot: true },
  radialBar: { innerRadius: "24%", outerRadius: "88%", background: false },
  xAxis: { tickLine: false, axisLine: false, hide: false },
  yAxis: { tickLine: false, axisLine: false, hide: false, tickCount: 5 },
  grid: { vertical: true, horizontal: true },
  polarGrid: { gridType: "polygon", radialLines: true, stroke: "var(--border)", strokeWidth: 1 },
  polarAngleAxis: {},
  label: { dy: 0, fontSize: 28, fontWeight: 400, fill: "var(--foreground)" },
  linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
} as const;

/**
 * The values that a mark \`label\` object leaves out. A bar, line or area label sits in the middle
 * of its mark, 5px from it, as the Recharts \`Label\` defaults. A pie label sits outside its slice,
 * 20px past the outer radius, as a Recharts pie \`label\`. The text keeps the foreground color at
 * 12px, as every shadcn label example sets it.
 */
export const CHART_MARK_LABEL_DEFAULTS = {
  cartesian: { position: "inside", offset: 5 },
  pie: { position: "outside", offset: 20 },
  fill: "var(--foreground)",
  fontSize: 12,
} as const;

/**
 * The fill opacity of an area with a gradient fill and no `fillOpacity`, as the Recharts area
 * default. The gradient stops then look as they do in shadcn.
 */
export const CHART_GRADIENT_FILL_OPACITY = 0.6;

/**
 * The value that the chart spec builder uses for each chart-level spec option that a chart leaves
 * out. The Runtime Adapter Contract repeats these values as the defaults of the props that set
 * them, and the same generator test keeps the two in step.
 */
export const CHART_SPEC_OPTION_DEFAULTS = {
  cursor: true,
  stackOffset: "none",
} as const;

/**
 * The part kinds that draw marks, as opposed to axes, grids, labels and gradients. The legend lists
 * the keys of these parts. The Vue legend seed prints this list when it is generated.
 */
export const CHART_MARK_KINDS = ["bar", "line", "area", "pie", "radar", "radialBar"] as const;
