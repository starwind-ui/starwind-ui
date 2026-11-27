import type { RuntimeAdapterContract } from "../types.js";

/**
 * The chart spec parts, in namespace order. Each name is also the `kind` of its Runtime
 * `ChartPart`. The parts render no element: they describe the chart as data. The Primitive and
 * Styled chart generators read their part lists from here.
 */
export const chartSpecPartNames = [
  "bar",
  "line",
  "area",
  "pie",
  "radar",
  "radialBar",
  "xAxis",
  "yAxis",
  "grid",
  "polarGrid",
  "polarAngleAxis",
  "label",
  "linearGradient",
] as const;

/**
 * The chart-level spec options. Each name is a contract prop on one part, as Recharts sets it on
 * the chart or the tooltip, and a field of the Runtime `ChartSpec` beside `parts`. The Primitive
 * generators read the props and their parts from here.
 */
export const chartSpecOptionNames = ["stackOffset", "cursor"] as const;

/** The public name of a chart spec part, such as `ChartBar`, and its Primitive namespace key. */
export function chartSpecPartExport(name: (typeof chartSpecPartNames)[number]) {
  const namespaceKey = `${name[0]!.toUpperCase()}${name.slice(1)}`;
  return { exportName: `Chart${namespaceKey}`, namespaceKey };
}

/**
 * A Recharts mark \`label\`: \`true\`, \`false\` or the look of the labels. The formatter maps to the
 * target's formatter type, so Astro takes a ChartFormat object only.
 */
const CHART_MARK_LABEL_TYPE =
  'boolean | { dataKey?: string; position?: "top" | "inside" | "insideLeft" | "insideStart" | "right" | "outside"; offset?: number; fill?: string; fontSize?: number; formatter?: ChartTickFormatter }';

/** A gradient coordinate: a number, a number string or a percent string, as SVG reads it. */
const CHART_GRADIENT_COORDINATE_TYPE = "number | `${number}` | `${number}%`";

/** A Recharts \`dot\` or \`activeDot\`: \`true\`, \`false\` or the look of the dots. */
const CHART_DOT_TYPE =
  "boolean | { r?: number; fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number }";

export const chartRuntimeAdapterContract = {
  component: "chart",
  category: "viewport-measurement",
  displayName: "Chart",
  runtime: {
    factory: "createChart",
    importSource: "@starwind-ui/runtime/chart",
    rootPart: "root",
    // `disableTooltip` is an adapter prop. The factory option is `tooltipDisabled`.
    optionProps: ["chart", "definition", "host", "onVisibleChange"],
    optionPropLifecycles: {
      chart: "setter-backed",
      definition: "setter-backed",
      host: "setter-backed",
      onVisibleChange: "setter-backed",
    },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart",
      forwardsRef: false,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart" },
        { name: "data-chart", source: "prop" },
      ],
    },
    {
      name: "style",
      description: "Writes the config color rules for light and dark themes.",
      defaultElement: "style",
      discoveryAttribute: "data-sw-chart-style",
      initialAttributes: [{ name: "data-slot", source: "constant", value: "chart-style" }],
    },
    {
      name: "surface",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart-surface",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-surface" },
        { name: "style", source: "runtime" },
      ],
    },
    {
      name: "tooltip",
      description:
        "Inside a chart root, the first Tooltip supplies the tooltip body, unless a Surface `tooltip` replaces it. Inside a tooltip body it renders its content in place. Elsewhere it renders nothing.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-tooltip",
    },
    {
      name: "tooltipContent",
      description: "The tooltip body content. It renders inside a tooltip body only.",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart-tooltip-content",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-tooltip-content" },
        { name: "data-chart", source: "state" },
        { name: "data-indicator", source: "state" },
        { name: "data-nested", source: "state" },
      ],
    },
    {
      name: "tooltipLabel",
      description:
        "The tooltip heading. It renders nothing when the heading is hidden, empty or nested in a row.",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart-tooltip-label",
      forwardsRef: true,
      initialAttributes: [{ name: "data-slot", source: "constant", value: "chart-tooltip-label" }],
    },
    {
      name: "tooltipItems",
      description: "Renders its content once per tooltip row, with that row in context.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-tooltip-row",
    },
    {
      name: "tooltipItem",
      description:
        "One tooltip row. Rows stay hidden from assistive technology, because the Runtime keeps the native status label in sync with the visible text. A formatter row renders the formatter view.",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart-tooltip-item",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-tooltip-item" },
        { name: "aria-hidden", source: "constant", value: "true" },
        { name: "data-active", source: "state" },
        { name: "data-key", source: "state" },
      ],
    },
    {
      name: "tooltipIndicator",
      description:
        "The row color marker. A row with an icon or a hidden indicator renders nothing.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-tooltip-indicator",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-tooltip-indicator" },
      ],
    },
    {
      name: "tooltipIcon",
      description:
        "The config icon of a row. Keep TooltipIndicator in the row too: a row with an icon shows the icon in place of the indicator, and a row without one shows the indicator.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-tooltip-icon",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-tooltip-icon" },
        { name: "aria-hidden", source: "constant", value: "true" },
      ],
    },
    {
      name: "tooltipName",
      description: "The row name. One line or dashed row nests the heading inside it.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-tooltip-name",
      forwardsRef: true,
      initialAttributes: [{ name: "data-slot", source: "constant", value: "chart-tooltip-name" }],
    },
    {
      name: "tooltipValue",
      description: "The formatted row value.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-tooltip-value",
      forwardsRef: true,
      initialAttributes: [{ name: "data-slot", source: "constant", value: "chart-tooltip-value" }],
    },
    {
      name: "legend",
      description: "A group of legend items.",
      defaultElement: "div",
      discoveryAttribute: "data-sw-chart-legend",
      forwardsRef: true,
      role: "group",
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-legend" },
        { name: "role", source: "constant", value: "group" },
        { name: "aria-label", source: "prop" },
      ],
    },
    {
      name: "legendItems",
      description:
        "Renders its content once per config key, with that key in context. A parts chart lists only the keys that it draws.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-legend-template",
    },
    {
      name: "legendItem",
      description:
        "A legend toggle for one config key. A click handler that calls `preventDefault()` cancels the toggle.",
      defaultElement: "button",
      discoveryAttribute: "data-sw-chart-legend-item",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-legend-item" },
        { name: "type", source: "constant", value: "button" },
        { name: "aria-pressed", source: "state" },
        { name: "data-state", source: "state" },
        { name: "data-key", source: "prop" },
      ],
    },
    {
      name: "legendSwatch",
      description:
        "The series color swatch. It renders nothing when the legend shows the config icon.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-legend-swatch",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-legend-swatch" },
        { name: "aria-hidden", source: "constant", value: "true" },
      ],
    },
    {
      name: "legendIcon",
      description:
        "The config icon of a legend item. It renders nothing without an icon or with `hideIcon`.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-legend-icon",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "chart-legend-icon" },
        { name: "aria-hidden", source: "constant", value: "true" },
      ],
    },
    {
      name: "legendLabel",
      description: "The config label of a legend item: a rich label, or its plain text.",
      defaultElement: "span",
      discoveryAttribute: "data-sw-chart-legend-label",
      forwardsRef: true,
      initialAttributes: [{ name: "data-slot", source: "constant", value: "chart-legend-label" }],
    },
    // Chart spec parts. Each renders no element and describes one piece of the chart as data, in
    // the order of its parts. Names and props follow Recharts.
    {
      name: "bar",
      description:
        "Adds bars for one data key. Bars with the same `stackId` stack. Other bars group.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-bar",
    },
    {
      name: "line",
      description: "Adds a line for one data key.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-line",
    },
    {
      name: "area",
      description:
        "Adds an area for one data key. Areas with the same `stackId` stack. Other areas overlap.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-area",
    },
    {
      name: "pie",
      description: "Adds a pie or donut. Slice colors come from config by `nameKey` value.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-pie",
    },
    {
      name: "radar",
      description:
        "Adds a radar area for one data key. The angle key comes from the polar angle axis.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-radar",
    },
    {
      name: "radialBar",
      description:
        "Adds radial bars. `background` draws the muted track. Bar colors come from config by `nameKey` value.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-radial-bar",
    },
    {
      name: "xAxis",
      description: "Adds the category axis of a cartesian chart.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-x-axis",
    },
    {
      name: "yAxis",
      description:
        "Adds the value axis of a cartesian chart. Without it, the chart draws no value labels.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-y-axis",
    },
    {
      name: "grid",
      description: "Adds cartesian grid lines.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-grid",
    },
    {
      name: "polarGrid",
      description: "Adds the radar grid: rings and the lines from the center to each category.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-polar-grid",
    },
    {
      name: "polarAngleAxis",
      description: "Adds the radar categories and their labels.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-polar-angle-axis",
    },
    {
      name: "label",
      description:
        "Adds a center line of text to a pie. Without `value`, it shows the total of the visible slices. Each label adds one line, so a second label with `dy` adds a line below the total.",
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-label",
    },
    {
      name: "linearGradient",
      description:
        'Adds a linear gradient that a bar or an area fills from with `fill="url(#id)"`. The chart scopes the id, so two charts can use the same id.',
      defaultElement: "template",
      discoveryAttribute: "data-sw-chart-part-linear-gradient",
    },
  ],
  props: [
    {
      name: "id",
      kind: "attribute",
      targets: ["root"],
      type: "string",
      description:
        "Names the chart. Leave it out to get a generated id that matches on server and client.",
    },
    {
      name: "chart",
      kind: "option",
      targets: ["root"],
      type: "ChartSource<T, D, X, Y>",
      description:
        "The chart module or factory that draws the chart from the data and the visible keys.",
    },
    {
      name: "definition",
      kind: "option",
      targets: ["root"],
      type: "DomChartDefinition<D, X, Y>",
      description:
        "A static native TanStack definition. It owns its visibility, so the legend is passive.",
    },
    {
      name: "data",
      kind: "option",
      targets: ["root"],
      type: "readonly T[]",
      description: "The data rows that the chart module reads.",
    },
    {
      name: "config",
      kind: "option",
      required: true,
      targets: ["root"],
      type: "ChartConfig",
      description: "The series labels, colors and icons, keyed by series.",
    },
    {
      name: "params",
      kind: "option",
      targets: ["root"],
      type: "Record<string, unknown>",
      description: "Extra values that the chart module reads.",
    },
    {
      name: "theme",
      kind: "option",
      targets: ["root"],
      type: 'ChartInput["theme"]',
      description: "Overrides the native TanStack chart theme.",
    },
    {
      name: "host",
      kind: "option",
      targets: ["root"],
      type: "NativeHostOptions<D, X, Y>",
      description: "Native TanStack host options, such as the focus and select callbacks.",
    },
    {
      name: "disableTooltip",
      kind: "option",
      defaultValue: "false",
      targets: ["root"],
      type: "boolean",
      description: "Turns the tooltip off.",
    },
    {
      name: "stackOffset",
      kind: "option",
      defaultValue: '"none"',
      targets: ["root"],
      type: '"none" | "expand"',
      description:
        'How the stacked bars and areas of a parts chart stack. `"expand"` stacks each category to 100%, and the tooltip keeps the raw values.',
    },
    { name: "visible", kind: "control", targets: ["root"], type: "readonly string[]" },
    { name: "defaultVisible", kind: "control", targets: ["root"], type: "readonly string[]" },
    {
      name: "onVisibleChange",
      kind: "callback",
      targets: ["root"],
      type: "(visible: string[], details: ChartVisibleChangeDetails) => void",
      description:
        "Receives proposed visible keys before the cancelable starwind-chart:visible-change event. Call details.cancel() to keep the current keys.",
    },
    {
      name: "children",
      kind: "children",
      targets: ["tooltip"],
      type: "ChartContent",
      description: "Tooltip body content.",
    },
    {
      name: "cursor",
      kind: "option",
      defaultValue: "true",
      targets: ["tooltip"],
      type: "boolean",
      description:
        "Draws the hover band of a bar chart. `false` removes it. Line and area charts draw no hover rule. In a parts chart, the first Tooltip at chart level sets it, because that Tooltip supplies the tooltip body. When it leaves `cursor` unset, the band shows. A Tooltip inside a tooltip body sets nothing.",
    },
    {
      name: "tooltip",
      kind: "rendering",
      targets: ["surface"],
      type: "ChartContent",
      description: "Tooltip body content. It wins over a registered Tooltip.",
    },
    {
      name: "fallbackTooltip",
      kind: "rendering",
      targets: ["surface"],
      type: "ChartContent",
      description: "Tooltip body content when no Tooltip is registered.",
    },
    {
      name: "nativeTooltip",
      kind: "option",
      defaultValue: "false",
      targets: ["surface"],
      type: "boolean",
      description: "Uses the native TanStack tooltip body.",
    },
    {
      name: "indicator",
      kind: "option",
      targets: ["tooltipContent"],
      type: '"dot" | "line" | "dashed"',
    },
    { name: "hideLabel", kind: "option", targets: ["tooltipContent"], type: "boolean" },
    { name: "hideIndicator", kind: "option", targets: ["tooltipContent"], type: "boolean" },
    {
      name: "label",
      kind: "rendering",
      targets: ["tooltipContent"],
      type: "ChartView",
      description: "Replaces the heading before labelFormatter runs.",
    },
    { name: "labelKey", kind: "option", targets: ["tooltipContent"], type: "string" },
    { name: "nameKey", kind: "option", targets: ["tooltipContent"], type: "string" },
    { name: "valueKey", kind: "option", targets: ["tooltipContent"], type: "string" },
    {
      name: "color",
      kind: "option",
      targets: ["tooltipContent"],
      type: "string",
      description: "Overrides each row's indicator color.",
    },
    {
      name: "formatter",
      kind: "callback",
      targets: ["tooltipContent"],
      type: "((value: unknown, name: string, item: TooltipItem<T>, index: number, payload: T) => ChartView) | ChartFormat",
      description:
        "A function returns the complete row view, with shadcn's argument order. `payload` is the native datum. A ChartFormat object formats only the row value.",
    },
    {
      name: "labelFormatter",
      kind: "callback",
      targets: ["tooltipContent"],
      type: "((label: unknown, payload: readonly TooltipItem<T>[]) => ChartView) | ChartFormat",
      description:
        "A function returns the complete heading view. A ChartFormat object formats the heading.",
    },
    {
      name: "children",
      kind: "children",
      targets: ["tooltipItems"],
      type: "ChartContent",
      description: "Rendered once per tooltip row, with that row in context.",
    },
    {
      name: "customClass",
      kind: "attribute",
      classHook: true,
      targets: ["tooltipItem"],
      type: "ChartClass",
      description: "The class for a row that a tooltip formatter replaced.",
    },
    {
      name: "labelClass",
      kind: "attribute",
      classHook: true,
      targets: ["tooltipName"],
      type: "ChartClass",
      description: "The class of the heading that one line or dashed row nests inside its name.",
    },
    {
      name: "hideIcon",
      kind: "option",
      defaultValue: "false",
      targets: ["legend"],
      type: "boolean",
      description: "Uses the swatch even when config supplies an icon.",
    },
    {
      name: "children",
      kind: "children",
      targets: ["legendItems"],
      type: "ChartContent",
      description:
        "Rendered once per config key, with that key in context. A parts chart lists only the keys that it draws.",
    },
    {
      name: "value",
      kind: "option",
      targets: ["legendItem"],
      type: "string",
      description: "The config key this item shows or hides. Defaults to the key from LegendItems.",
    },
    {
      name: "interactive",
      kind: "option",
      targets: ["legendItem"],
      type: "boolean",
      description:
        "Defaults to false for a static native definition. A passive item renders a span.",
    },
    // Chart spec part props. Names follow Recharts.
    {
      name: "dataKey",
      kind: "option",
      required: true,
      targets: ["bar", "line", "area", "pie", "radar", "radialBar"],
      type: "string",
      description: "The data key of the values this part draws.",
    },
    {
      name: "dataKey",
      kind: "option",
      required: true,
      targets: ["xAxis", "polarAngleAxis"],
      type: "string",
      description: "The data key of the categories.",
    },
    {
      name: "nameKey",
      kind: "option",
      required: true,
      targets: ["pie", "radialBar"],
      type: "string",
      description:
        "The data key whose values name the slices or bars. Their colors come from config by this value.",
    },
    {
      name: "stackId",
      kind: "option",
      targets: ["bar"],
      type: "string | number",
      description: "Bars with the same stackId stack. Other bars group.",
    },
    {
      name: "stackId",
      kind: "option",
      targets: ["area"],
      type: "string | number",
      description: "Areas with the same stackId stack. Other areas overlap.",
    },
    {
      name: "radius",
      kind: "option",
      defaultValue: "0",
      targets: ["bar"],
      type: "number | readonly [number, number, number, number]",
      description:
        "The corner radius in pixels. A number rounds the bar end. Four numbers set the top left, top right, bottom right and bottom left corners, as in Recharts.",
    },
    {
      name: "type",
      kind: "option",
      defaultValue: '"natural"',
      targets: ["line"],
      type: '"natural" | "monotone" | "linear" | "step"',
      description: "The curve of the line.",
    },
    {
      name: "type",
      kind: "option",
      defaultValue: '"monotone"',
      targets: ["area"],
      type: '"natural" | "monotone" | "linear" | "step"',
      description: "The curve of the area edge.",
    },
    {
      name: "fill",
      kind: "option",
      targets: ["bar", "area"],
      type: "string",
      description:
        'The fill color, or `"url(#id)"` for the ChartLinearGradient with that id. Defaults to the config color.',
    },
    {
      name: "stroke",
      kind: "option",
      targets: ["line", "area"],
      type: "string",
      description: "The stroke color. Defaults to the config color.",
    },
    {
      name: "strokeWidth",
      kind: "option",
      defaultValue: "2",
      targets: ["line", "area", "radar"],
      type: "number",
      description: "The stroke width in pixels.",
    },
    {
      name: "stroke",
      kind: "option",
      defaultValue: '"var(--card)"',
      targets: ["pie"],
      type: "string",
      description: 'The color of the line between slices. `"none"` removes the line.',
    },
    {
      name: "strokeWidth",
      kind: "option",
      defaultValue: "2",
      targets: ["pie"],
      type: "number",
      description: "The width of the line between slices in pixels.",
    },
    {
      name: "fillOpacity",
      kind: "option",
      defaultValue: "0.22",
      targets: ["area"],
      type: "number",
      description:
        "The fill opacity. A gradient fill without it takes 0.6, the Recharts default, so the stops look as in shadcn.",
    },
    {
      name: "fillOpacity",
      kind: "option",
      defaultValue: "0.18",
      targets: ["radar"],
      type: "number",
      description: "The fill opacity.",
    },
    {
      name: "dot",
      kind: "option",
      defaultValue: "false",
      targets: ["line", "radar"],
      type: CHART_DOT_TYPE,
      booleanOrObject: true,
      description: "Draws a dot at every value. An object sets the dot radius, fill and stroke.",
    },
    {
      name: "activeDot",
      kind: "option",
      defaultValue: "true",
      targets: ["line", "radar"],
      type: CHART_DOT_TYPE,
      booleanOrObject: true,
      description:
        "Draws a dot at the focused value. An object sets the dot radius, fill and stroke.",
    },
    {
      name: "activeDot",
      kind: "option",
      defaultValue: "true",
      targets: ["area"],
      type: "boolean",
      description: "Draws a dot at the focused value.",
    },
    {
      name: "label",
      kind: "option",
      defaultValue: "false",
      targets: ["bar", "line", "area"],
      type: CHART_MARK_LABEL_TYPE,
      booleanOrObject: true,
      description:
        "Draws a label on each bar or value, as a Recharts `label` or `LabelList`. An object sets the row field, position, offset, color, font size and formatter. Labels sit in the middle of the mark, 5px from it, unless `position` says otherwise.",
    },
    {
      name: "label",
      kind: "option",
      defaultValue: "false",
      targets: ["pie"],
      type: CHART_MARK_LABEL_TYPE,
      booleanOrObject: true,
      description:
        'Draws a label on each slice, as a Recharts pie `label`. Labels sit 20px outside the slices, and the pie shrinks to make room. `position: "inside"` puts them in the middle of the slices.',
    },
    {
      name: "labelLine",
      kind: "option",
      defaultValue: "true",
      targets: ["pie"],
      type: "boolean",
      description: "Draws a line from each slice to its outside label.",
    },
    {
      name: "innerRadius",
      kind: "option",
      defaultValue: "0",
      targets: ["pie"],
      type: "number | `${number}%`",
      description:
        "The inner radius: plain pixels at any chart size, or a percent of half the smaller side.",
    },
    {
      name: "innerRadius",
      kind: "option",
      defaultValue: '"24%"',
      targets: ["radialBar"],
      type: "number | `${number}%`",
      description:
        "The inner radius: plain pixels at any chart size, or a percent of half the smaller side.",
    },
    {
      name: "outerRadius",
      kind: "option",
      defaultValue: '"90%"',
      targets: ["pie"],
      type: "number | `${number}%`",
      description:
        "The outer radius: plain pixels at any chart size, or a percent of half the smaller side.",
    },
    {
      name: "outerRadius",
      kind: "option",
      defaultValue: '"88%"',
      targets: ["radialBar"],
      type: "number | `${number}%`",
      description:
        "The outer radius: plain pixels at any chart size, or a percent of half the smaller side.",
    },
    {
      name: "paddingAngle",
      kind: "option",
      targets: ["pie"],
      type: "number",
      description:
        "The gap between slices in degrees. Without it, slices keep a gap of about 1.4 degrees.",
    },
    {
      name: "background",
      kind: "option",
      defaultValue: "false",
      targets: ["radialBar"],
      type: "boolean",
      description: "Draws the muted track behind each bar.",
    },
    {
      name: "tickFormatter",
      kind: "option",
      targets: ["xAxis", "yAxis", "polarAngleAxis"],
      type: "ChartTickFormatter",
      description:
        "Formats the tick labels: a function or a ChartFormat object. Astro accepts only a ChartFormat object.",
    },
    {
      name: "tickLine",
      kind: "option",
      defaultValue: "false",
      targets: ["xAxis", "yAxis"],
      type: "boolean",
      description: "Draws tick lines.",
    },
    {
      name: "axisLine",
      kind: "option",
      defaultValue: "false",
      targets: ["xAxis", "yAxis"],
      type: "boolean",
      description: "Draws the axis line.",
    },
    {
      name: "tickMargin",
      kind: "option",
      targets: ["xAxis", "yAxis"],
      type: "number",
      description: "The gap between a tick and its label in pixels.",
    },
    {
      name: "hide",
      kind: "option",
      defaultValue: "false",
      targets: ["xAxis", "yAxis"],
      type: "boolean",
      description: "Keeps the scale and hides the axis.",
    },
    {
      name: "tickCount",
      kind: "option",
      defaultValue: "5",
      targets: ["yAxis"],
      type: "number",
      description: "The preferred number of ticks.",
    },
    {
      name: "vertical",
      kind: "option",
      defaultValue: "true",
      targets: ["grid"],
      type: "boolean",
      description: "Draws vertical grid lines.",
    },
    {
      name: "horizontal",
      kind: "option",
      defaultValue: "true",
      targets: ["grid"],
      type: "boolean",
      description: "Draws horizontal grid lines.",
    },
    {
      name: "gridType",
      kind: "option",
      defaultValue: '"polygon"',
      targets: ["polarGrid"],
      type: '"polygon" | "circle"',
      description: "The shape of the radar grid.",
    },
    {
      name: "radialLines",
      kind: "option",
      defaultValue: "true",
      targets: ["polarGrid"],
      type: "boolean",
      description: "Draws the lines from the center to each category.",
    },
    {
      name: "fill",
      kind: "option",
      targets: ["polarGrid"],
      type: "string",
      description: "The fill color of the rings. Without it, the rings have no fill.",
    },
    {
      name: "fillOpacity",
      kind: "option",
      targets: ["polarGrid"],
      type: "number",
      description: "The fill opacity of the rings. Each ring fills its whole disc.",
    },
    {
      name: "stroke",
      kind: "option",
      defaultValue: '"var(--border)"',
      targets: ["polarGrid"],
      type: "string",
      description: "The color of the rings and the lines.",
    },
    {
      name: "strokeWidth",
      kind: "option",
      defaultValue: "1",
      targets: ["polarGrid"],
      type: "number",
      description: "The width of the rings and the lines in pixels.",
    },
    {
      name: "polarRadius",
      kind: "option",
      targets: ["polarGrid"],
      type: "readonly number[]",
      description:
        "The ring radii in pixels, as in Recharts. Without it, the rings sit at the value ticks.",
    },
    {
      name: "position",
      kind: "option",
      targets: ["label"],
      type: '"center"',
      description: "Where the label sits.",
    },
    {
      name: "value",
      kind: "option",
      targets: ["label"],
      type: "string | number",
      description: "The label text. Without it, a pie shows the total of its visible slices.",
    },
    {
      name: "dy",
      kind: "option",
      defaultValue: "0",
      targets: ["label"],
      type: "number",
      description: "Moves the text down by this many pixels. A negative value moves it up.",
    },
    {
      name: "fontSize",
      kind: "option",
      defaultValue: "28",
      targets: ["label"],
      type: "number",
      description: "The font size in pixels.",
    },
    {
      name: "fontWeight",
      kind: "option",
      defaultValue: "400",
      targets: ["label"],
      type: "number",
      description:
        "The font weight, such as 700 for the bold total of a shadcn donut chart. At the default, the text keeps the weight of the page.",
    },
    {
      name: "fill",
      kind: "option",
      defaultValue: '"var(--foreground)"',
      targets: ["label"],
      type: "string",
      description: "The text color.",
    },
    {
      name: "id",
      kind: "option",
      required: true,
      targets: ["linearGradient"],
      type: "string",
      description: 'The gradient id that a fill such as `"url(#fillDesktop)"` names.',
    },
    {
      name: "x1",
      kind: "option",
      defaultValue: "0",
      targets: ["linearGradient"],
      type: CHART_GRADIENT_COORDINATE_TYPE,
      description:
        "The start x: 0 is the left edge and 1 the right edge, or a percent string. With the defaults, the gradient runs from left to right, as in SVG.",
    },
    {
      name: "y1",
      kind: "option",
      defaultValue: "0",
      targets: ["linearGradient"],
      type: CHART_GRADIENT_COORDINATE_TYPE,
      description: "The start y: 0 is the top edge and 1 the bottom edge, or a percent string.",
    },
    {
      name: "x2",
      kind: "option",
      defaultValue: "1",
      targets: ["linearGradient"],
      type: CHART_GRADIENT_COORDINATE_TYPE,
      description: "The end x, as `x1`.",
    },
    {
      name: "y2",
      kind: "option",
      defaultValue: "0",
      targets: ["linearGradient"],
      type: CHART_GRADIENT_COORDINATE_TYPE,
      description:
        "The end y, as `y1`. For a gradient from top to bottom, shadcn sets `x2` to 0 and `y2` to 1.",
    },
    {
      name: "stops",
      kind: "option",
      required: true,
      targets: ["linearGradient"],
      type: "readonly { offset: number | `${number}` | `${number}%`; stopColor: string; stopOpacity?: number }[]",
      description:
        'The color stops, as SVG `<stop>` elements. An offset is a number from 0 to 1 or a percent string such as `"5%"`.',
    },
    // Astro-only props. Astro renders on the server, so a Root can render a static chart and take
    // rich views as HTML, and a Legend can render outside a Root from its own config.
    {
      name: "interactive",
      kind: "option",
      defaultValue: "true",
      targets: ["root"],
      type: "boolean",
      unsupportedTargets: ["react", "vue", "svelte"],
      description:
        "Renders the wire payload, the tooltip and legend templates and, for a chart module or chart parts, the lifecycle script. `false` renders a static chart that loads no script.",
    },
    {
      name: "labels",
      kind: "option",
      targets: ["root"],
      type: "Record<string, string>",
      unsupportedTargets: ["react", "vue", "svelte"],
      description:
        "Rich label HTML per config key, for a wrapper that renders its own `label-<key>` slots. A `label-<key>` slot on the Root wins.",
    },
    {
      name: "icons",
      kind: "option",
      targets: ["root"],
      type: "Record<string, string>",
      unsupportedTargets: ["react", "vue", "svelte"],
      description:
        "Icon HTML per config key, for a wrapper that renders its own `icon-<key>` slots.",
    },
    {
      name: "config",
      kind: "option",
      targets: ["legend"],
      type: "ChartConfig",
      unsupportedTargets: ["react", "vue", "svelte"],
      description:
        "Renders the legend from this config. Leave it out inside a chart Root, which fills the legend with its own config, visibility and rich label slots.",
    },
    {
      name: "visible",
      kind: "option",
      targets: ["legend"],
      type: "readonly string[]",
      unsupportedTargets: ["react", "vue", "svelte"],
      description: "Visible keys for a legend that takes `config`.",
    },
  ],
  stateModels: [
    {
      name: "visible",
      controlledProp: "visible",
      defaultProp: "defaultVisible",
      valueType: "string[]",
      runtimeGetter: "getVisible",
      runtimeSetter: "setVisible",
      runtimeSetterUsage:
        "call setVisible(next, { emit: false }) for silent updates, because a legend toggle commits on its own",
      runtimeSyncEvent: "starwind-chart:visible-change",
      ownership: {
        controlledWhen: "initial-defined",
        lifetime: "mount",
        laterUndefined: "retain-controlled-value",
        laterDefined: "silent-command",
      },
    },
  ],
  events: [
    {
      name: "visibleChange",
      callbackProp: "onVisibleChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      detailsType: "ChartVisibleChangeDetails",
      domEvent: "starwind-chart:visible-change",
      emitsFrom: "root",
      stateModel: "visible",
      valueProperty: "visible",
      valueType: "string[]",
    },
  ],
  refs: [
    { part: "surface", public: true },
    { part: "tooltipContent", public: true },
    { part: "tooltipLabel", public: true },
    { part: "tooltipItem", public: true },
    { part: "tooltipIndicator", public: true },
    { part: "tooltipIcon", public: true },
    { part: "tooltipName", public: true },
    { part: "tooltipValue", public: true },
    { part: "legend", public: true },
    { part: "legendItem", public: true },
    { part: "legendSwatch", public: true },
    { part: "legendIcon", public: true },
    { part: "legendLabel", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-slot", "data-chart"],
      reason:
        "The chart root carries the chart id that scopes config colors and becomes the native id prefix.",
    },
    {
      part: "surface",
      attributes: ["data-sw-chart-surface", "data-slot", "style"],
      reason:
        "The surface holds the server-rendered SVG and reserves its size, so the Runtime controller adopts it without a second render.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Astro has no component context, so part components write markers and the Root fills them from chart data: the prerendered surface, config styles, legend items and the winning tooltip template.",
      "The Root renders a wire payload and tooltip and legend templates that the Runtime fills, and renders the lifecycle script only for an interactive chart module or parts chart, so a static chart loads no script.",
      "Chart spec parts write markers in the rendered slot content. The Root collects them in source order into the chart spec that the wire payload carries.",
    ],
    react: [
      "Prerender the surface SVG on the server and on the first client render, then create the Runtime controller in a layout effect so it adopts that SVG. React never writes the surface content again.",
      "Portal the registered tooltip body into the controller's tooltip body target and sync the accessible status label after each body render.",
      "Legend items call the controller toggle from their own click handler, so a consumer handler that calls preventDefault cancels the toggle.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "Adapters own chart input props, the visibility model props, generated ids, tooltip registration, tooltip and legend composition, and framework view rendering; the Runtime owns prerender, adoption, TanStack rendering, the accepted visible keys, visibility requests and events, config color styles, tooltip body targets, the accessible label sync and teardown.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "chart parts, data-slot values and discovery attributes",
        "visibility model props and the cancelable visible-change event",
        "tooltip content and legend props",
      ],
      demotionCriteria:
        "Demote when a generic engine-surface template can express prerender adoption, tooltip body portals and row iteration across adapters.",
      reason:
        "Chart is backed by the TanStack renderer through the Runtime controller and needs component-specific composition for tooltip registration, tooltip rows and legend keys.",
      tests: [
        "packages/runtime/tests/components/chart/chart.browser.test.ts",
        "packages/react/tests/chart.browser.test.tsx",
        "packages/react/tests/chart.ssr.test.tsx",
        "scripts/portable-runtime/tests/chart-styled/astro.browser.tsx",
        "scripts/portable-runtime/tests/chart-specialized-adapter-spec.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
