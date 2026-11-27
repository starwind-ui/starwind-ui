import {
  CHART_MESSAGES,
  type ChartSpecPartName,
  type ChartSurfaceComponentProjection,
  type ChartSurfaceFacts,
  type ChartSurfaceIndexProjection,
  type ChartSurfacePartName,
  type ChartSurfacePropFacts,
  type ChartTypeWords,
  chartComment,
  chartLegendKeyMessage,
  chartPartProps,
  chartProp,
  chartPropDefault,
  chartPropType,
  chartPublicTypes,
  chartSpecOptions,
  chartSpecOptionsObject,
  chartSpecPartFiles,
  printChartSpecOptionFields,
  printChartSpecPartPropsTable,
  printChartSpecPartTypes,
} from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import type {
  AdapterComponentFile,
  AdapterFamilyHelperProjection,
  AdapterHelperFile,
  AdapterOutputModel,
} from "../types.js";

export type AstroChartSurfaceComponentProjection = ChartSurfaceComponentProjection;
export type AstroChartSurfaceIndexProjection = ChartSurfaceIndexProjection;

/**
 * Astro-only support files: the conditional lifecycle script, the marker renderer and the chart
 * spec parts, which write markers that the Root collects.
 */
type AstroChartSupportProjection =
  | { facts: ChartSurfaceFacts; kind: "astro-chart-lifecycle" | "astro-chart-markup" }
  | { facts: ChartSurfaceFacts; kind: "astro-chart-spec-part"; part: ChartSpecPartName };

/**
 * Helper values that the Astro chart index adds for page scripts: Raw HTML control of a
 * server-rendered root, explicit module registration, and the wire and style helpers.
 */
const ASTRO_CHART_HELPER_VALUES = [
  "chartStyle",
  "createChart",
  "getChartController",
  "registerChartModules",
  "serializeInput",
] as const;

export function isAstroChartSurfaceProjection(family: unknown): boolean {
  return (family as { kind?: string } | undefined)?.kind === "chart-surface";
}

export function isAstroChartSupportProjection(family: unknown): boolean {
  const kind = (family as { kind?: string } | undefined)?.kind;
  return (
    kind === "astro-chart-lifecycle" ||
    kind === "astro-chart-markup" ||
    kind === "astro-chart-spec-part"
  );
}

/**
 * Adds the Astro support files to the chart output model. Astro has no component context, so part
 * components write markers and the chart Root fills them from chart data.
 */
export function projectAstroChartSurfaceOutputModel(model: AdapterOutputModel): AdapterOutputModel {
  const index = model.files.find(
    (file) => file.kind === "index" && isAstroChartSurfaceProjection(file.family),
  );
  if (!index || index.kind !== "index") return model;
  const facts = (index.family as unknown as ChartSurfaceIndexProjection).facts;
  const directory = index.path.slice(0, index.path.lastIndexOf("/"));
  const n = names(facts);
  const template = model.files.find(
    (file): file is AdapterComponentFile =>
      file.kind === "component" && isAstroChartSurfaceProjection(file.component.family),
  );
  if (!template) return model;

  const lifecycle: AdapterComponentFile = {
    ...template,
    component: {
      ...template.component,
      displayName: `${facts.displayName}.Lifecycle`,
      family: {
        facts,
        kind: "astro-chart-lifecycle",
      } as unknown as AdapterComponentFile["component"]["family"],
      name: n.lifecycle,
    },
    path: `${directory}/${n.lifecycle}`,
    target: "astro",
  };
  const markup: AdapterHelperFile = {
    body: { code: "" } as AdapterHelperFile["body"],
    family: { facts, kind: "astro-chart-markup" } as unknown as AdapterFamilyHelperProjection,
    imports: [],
    kind: "helper",
    name: n.markup,
    path: `${directory}/${n.markup}.ts`,
    target: "astro",
  };
  const specParts = chartSpecPartFiles(
    facts,
    template,
    directory,
    "astro-chart-spec-part",
    "astro",
  );
  const files = [...model.files];
  files.splice(files.indexOf(index), 0, ...specParts, lifecycle, markup);
  return { files };
}

export function printAstroChartSurfaceComponent(family: unknown): string {
  const projection = family as AstroChartSurfaceComponentProjection | AstroChartSupportProjection;
  if (projection.kind !== "chart-surface") {
    if (projection.kind === "astro-chart-lifecycle") return printLifecycle(projection.facts);
    if (projection.kind === "astro-chart-spec-part")
      return printSpecPart(projection.facts, projection.part);
    throw new Error("The Astro chart markup module prints as a helper file.");
  }
  const { facts, part } = projection;
  switch (facts.parts[part].role) {
    case "root":
      return printRoot(facts);
    case "config-style":
      return printStyle(facts);
    case "surface":
      return printSurface(facts);
    case "tooltip-registration":
      return printTooltip(facts);
    case "tooltip-content":
      return printTooltipContent(facts);
    case "tooltip-heading":
      return printTooltipLabel(facts);
    case "tooltip-rows":
      return printTooltipItems(facts);
    case "tooltip-row":
      return printTooltipItem(facts);
    case "tooltip-row-indicator":
      return printTooltipIndicator(facts);
    case "tooltip-row-icon":
      return printTooltipIcon(facts);
    case "tooltip-row-name":
      return printTooltipName(facts);
    case "tooltip-row-value":
      return printTooltipValue(facts);
    case "legend":
      return printLegend(facts);
    case "legend-keys":
      return printLegendItems(facts);
    case "legend-item":
      return printLegendItem(facts);
    case "legend-swatch":
      return printLegendSwatch(facts);
    case "legend-icon":
      return printLegendIcon(facts);
    case "legend-label":
      return printLegendLabel(facts);
  }
}

export function printAstroChartSurfaceHelper(family: unknown): string {
  return printMarkup((family as AstroChartSupportProjection).facts);
}

export function printAstroChartSurfaceIndex({ facts }: AstroChartSurfaceIndexProjection): string {
  const parts = [...Object.values(facts.parts), ...Object.values(facts.specParts)];
  const n = names(facts);
  const imports = parts
    .map((part) => `import ${part.exportName} from "./${part.exportName}.astro";`)
    .sort()
    .join("\n");
  const members = parts.map((part) => `  ${part.namespaceKey}: ${part.exportName},`).join("\n");
  const named = parts
    .map((part) => part.exportName)
    .sort()
    .map((name) => `  ${name},`)
    .join("\n");
  const values = [...new Set([...facts.exports.helperValues, ...ASTRO_CHART_HELPER_VALUES])].sort();
  // Astro parts share no component context, so the index leaves out the context types.
  const publicTypes = chartPublicTypes(facts);
  const types = [...publicTypes.all, ...publicTypes.rootUnion, ...publicTypes.specParts].sort();
  const helperTypes = [...facts.exports.helperTypes].sort();

  return `${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${facts.exports.namespace} as ${facts.exports.namespaceAlias},
${named}
};

export default ${facts.exports.namespace};

export type {
${helperTypes.map((name) => `  ${name},`).join("\n")}
} from "${facts.exports.runtimeImportSource}";
export {
${values.map((name) => `  ${name},`).join("\n")}
} from "${facts.exports.runtimeImportSource}";
export { ${n.collectViews} } from "./${n.markup}";
export type {
${types.map((name) => `  ${name},`).join("\n")}
} from "./${n.markup}";
`;
}

function names(facts: ChartSurfaceFacts) {
  return {
    collectSpec: `collect${facts.displayName}Spec`,
    collectViews: `collect${facts.displayName}Views`,
    lifecycle: `${facts.displayName}Lifecycle`,
    markup: `${facts.displayName}Markup`,
  };
}

/** Astro renders on the server, so views and body content are HTML strings. */
const WORDS: ChartTypeWords = { ChartClass: "string", ChartContent: "string", ChartView: "string" };

/** Astro doc text where the server render changes the meaning, by `part.prop`. */
const ASTRO_PROP_DOCS: Partial<Record<string, string>> = {
  "legendItem.interactive":
    "Defaults to false for a static native definition or a static chart. A passive item renders a span.",
};

/** The contract props of a part as type fields, each with its doc comment. */
function propFields(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  include: (prop: ChartSurfacePropFacts) => boolean = () => true,
): string {
  return chartPartProps(facts, part, "astro")
    .filter((prop) => prop.kind !== "children" && include(prop))
    .map((prop) => {
      const text = ASTRO_PROP_DOCS[`${part}.${prop.name}`] ?? prop.description;
      return `${text ? `${chartComment(text, "block", "  ")}\n` : ""}  ${prop.name}?: ${chartPropType(prop, WORDS)};`;
    })
    .join("\n");
}

/** The Astro-only contract props of a part, as type fields. */
function astroOnlyFields(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return propFields(facts, part, (prop) => prop.unsupportedTargets !== undefined);
}

function propsName(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return `${facts.parts[part].exportName}Props`;
}

function slot(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  const value = facts.parts[part].dataSlot;
  if (!value) throw new Error(`Astro chart part "${part}" needs a data-slot.`);
  return value;
}

function printRoot(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import {
  assertChartId,
  chartLegendKeys,
  createChartId,
  datesToStrings,
  serializeChartPayload,
  visibleKeys,
  warnEmptyChart,
} from "${facts.runtime.importSource}";
import ${n.lifecycle} from "./${n.lifecycle}.astro";
import {
  type ChartRootProps,
  type ChartValue,
  chartViewTemplates,
  ${n.collectSpec},
  ${n.collectViews},
  renderChartContent,
} from "./${n.markup}";

type Props<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ChartRootProps<T, D, X, Y>;

const {
  id = createChartId(),
  chart,
  definition,
  data = [],
  config,
  params,
  theme,
  host,
  disableTooltip = false,
${chartSpecOptions(facts, "root")
  .map(({ name }) => `  ${name},`)
  .join("\n")}
  interactive: interactiveProp = true,
  labels: labelsProp,
  icons: iconsProp,
  visible: visibleProp,
  defaultVisible,
  "aria-label": ariaLabel,
  // The part owns its data-slot, as in every framework.
  "data-slot": _dataSlot,
  ...rest
} = Astro.props;

assertChartId(id);
const rendered = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
// Chart spec parts in the default slot describe the chart as data, in source order. The Root's own
// options and the options that a part such as the Tooltip writes join them.
const { html: content, spec } = ${n.collectSpec}(rendered, ${chartSpecOptionsObject(facts, "root")});
if (spec && (chart !== undefined || definition !== undefined)) {
  throw new TypeError(
    ${JSON.stringify(CHART_MESSAGES.partsMix)},
  );
}
// Without chart parts, a chart and a definition, the chart renders nothing and warns once.
const empty = !spec && chart === undefined && definition === undefined;
if (empty) warnEmptyChart(id);
const interactive = interactiveProp && !empty;
const mode = definition ? "definition" : "source";
if (mode === "definition" && (visibleProp !== undefined || defaultVisible !== undefined)) {
  throw new TypeError(
    ${JSON.stringify(CHART_MESSAGES.definitionVisibility(`${facts.visibility.controlledProp} and ${facts.visibility.defaultProp}`))},
  );
}
const visible = visibleKeys(config, visibleProp ?? defaultVisible);
// The wire payload carries Date fields as ISO strings, so the server render draws from the same
// data and the browser restart matches it.
const input = {
  data: spec ? datesToStrings(data) : data,
  config,
  ...(spec ? { spec } : {}),
  ...(mode === "source" ? { visible } : {}),
  ...(params ? { params } : {}),
  ...(theme ? { theme } : {}),
};
// A parts chart takes its accessible name from \`aria-label\`. Other charts keep it on the root.
const chartHost = spec && ariaLabel != null ? { ...host, ariaLabel: String(ariaLabel) } : host;
const moduleId = typeof chart === "object" && chart !== null ? chart.id : undefined;
// A registered chart module and a parts chart start from the lifecycle script. Other interactive
// charts start from a page script that calls createChart.
const lifecycle = interactive && (moduleId !== undefined || spec !== undefined);

const { labels, icons } = await ${n.collectViews}(Astro.slots, config, labelsProp, iconsProp);
const html = renderChartContent(content, {
  id,
  chart,
  definition,
  input,
  host: chartHost,
  disableTooltip,
  empty,
  legend: {
    config,
    // A parts chart lists the config keys that it draws, as the Runtime does in the browser.
    keys: chartLegendKeys(spec, input.data, config),
    visible,
    interactive: interactive && mode === "source",
    template: interactive,
    labels,
    icons,
  },
});
const templates = interactive ? chartViewTemplates(config, labels, icons) : "";
const payload = interactive
  ? serializeChartPayload({ input, host: chartHost, tooltipDisabled: disableTooltip })
  : "";
---

<div
  {...rest}
  aria-label={spec ? undefined : ariaLabel}
  data-slot="${slot(facts, "root")}"
  ${facts.attrs.chartId}={id}
  data-chart-module={moduleId}
  data-sw-chart={lifecycle ? "" : undefined}
  data-state={interactive ? "pending" : "static"}
>
  <Fragment set:html={html + templates} />
  {interactive && <script is:inline type="application/json" data-sw-chart-input set:html={payload} />}
  {lifecycle && <${n.lifecycle} />}
</div>
`;
}

function printStyle(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "style")}, chartMarker } from "./${n.markup}";

type Props = ${propsName(facts, "style")};

// The chart Root writes the config color rules for light and dark themes here.
---

<Fragment set:html={chartMarker("style", Astro.props)} />
`;
}

function printSurface(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import {
  CHART_TOOLTIP_FALLBACK_END,
  CHART_TOOLTIP_FALLBACK_START,
  type ${propsName(facts, "surface")},
  chartSurfaceMarker,
} from "./${n.markup}";

type Props = ${propsName(facts, "surface")};

const { tooltip, fallbackTooltip: FallbackTooltip, nativeTooltip = ${chartPropDefault(facts, "surface", "nativeTooltip")}, ...rest } = Astro.props;

// The chart Root renders the prerendered SVG and the reserved size in place of this marker.
---

<Fragment set:html={chartSurfaceMarker(rest, { nativeTooltip, tooltip })} />{
  !nativeTooltip && FallbackTooltip && (
    <>
      <Fragment set:html={CHART_TOOLTIP_FALLBACK_START} />
      <FallbackTooltip />
      <Fragment set:html={CHART_TOOLTIP_FALLBACK_END} />
    </>
  )
}
`;
}

function printTooltip(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "tooltip")}, chartTooltipRegistration } from "./${n.markup}";

type Props = ${propsName(facts, "tooltip")};

const { ${chartSpecOptions(facts, "tooltip")
    .map(({ name }) => name)
    .join(", ")} } = Astro.props;
/**
 * Inside a chart Root, the first Tooltip supplies the tooltip body. Elsewhere it renders nothing.
 * Its registration carries its chart-level options, so the first chart-level Tooltip decides them.
 */
const content = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
---

<Fragment set:html={chartTooltipRegistration(content, ${chartSpecOptionsObject(facts, "tooltip")})} />
`;
}

function printTooltipContent(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import {
  assertChartFormat,
  type ChartTooltipContentProps,
  extractChartTooltipIconClass,
} from "./${n.markup}";

type Props = ChartTooltipContentProps;

const {
  indicator,
  hideLabel,
  hideIndicator,
  label,
  labelKey,
  nameKey,
  valueKey,
  color,
  formatter,
  labelFormatter,
  // The part owns its data-slot, as in every framework.
  "data-slot": _dataSlot,
  ...rest
} = Astro.props;

// Functions cannot travel from the server, so formatters are ChartFormat objects. Function
// formatters belong in the chart module's \`domPresentation\`.
assertChartFormat("ChartTooltipContent formatter", formatter);
assertChartFormat("ChartTooltipContent labelFormatter", labelFormatter);
const children = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
const { html, iconClass } = extractChartTooltipIconClass(children);
// The Runtime fills this template for each tooltip body.
const options = Object.fromEntries(
  Object.entries({
    indicator,
    hideLabel,
    hideIndicator,
    label,
    labelKey,
    nameKey,
    valueKey,
    color,
    formatter,
    labelFormatter,
    iconClass,
  }).filter(([, value]) => value !== undefined),
);
---

<template data-sw-chart-tooltip data-sw-chart-tooltip-options={JSON.stringify(options)}>
  <div {...rest} data-slot="${slot(facts, "tooltipContent")}" data-indicator={indicator ?? "${facts.defaults.indicator}"}>
    <Fragment set:html={html} />
  </div>
</template>
`;
}

function printTooltipLabel(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipLabel")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipLabel")};

// The tooltip heading. The Runtime fills it, removes it when it is hidden or empty, and reuses
// its class for the heading that one line or dashed row nests inside its name.
const { "data-slot": _dataSlot, ...rest } = Astro.props;
---

<div {...rest} data-slot="${slot(facts, "tooltipLabel")}"></div>
`;
}

function printTooltipItems(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipItems")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipItems")};

// The Runtime renders this row template once per tooltip row.
---

<template data-sw-chart-tooltip-row><slot /></template>
`;
}

function printTooltipItem(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipItem")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipItem")};

// One tooltip row. Rows stay hidden from assistive technology, because the Runtime keeps the
// native status label in sync with the visible text. The Runtime gives a formatter row the custom
// class.
const { customClass, "data-slot": _dataSlot, ...rest } = Astro.props;
const attributes = { ...rest, "data-sw-chart-custom-class": customClass };
---

<div {...attributes} data-slot="${slot(facts, "tooltipItem")}" aria-hidden="true"><slot /></div>
`;
}

function printTooltipIndicator(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipIndicator")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipIndicator")};

// The row color marker. The Runtime removes it for a hidden indicator and shows the config icon
// in its place.
const { "data-slot": _dataSlot, ...rest } = Astro.props;
---

<span {...rest} data-slot="${slot(facts, "tooltipIndicator")}"></span>
`;
}

function printTooltipIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "tooltipIcon")}, chartMarker } from "./${n.markup}";

type Props = ${propsName(facts, "tooltipIcon")};

// The config icon of a row. TooltipContent passes this class to the Runtime, which shows the icon
// in the indicator position.
---

<Fragment set:html={chartMarker("tooltip-icon", { class: Astro.props.class })} />
`;
}

function printTooltipName(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipName")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipName")};

${chartComment(`${facts.parts.tooltipName.doc!} The Runtime gives that heading this \`labelClass\`, or the TooltipLabel class when it is absent.`, "line")}
const { labelClass, "data-slot": _dataSlot, ...rest } = Astro.props;
---

<span {...rest} data-sw-chart-label-class={labelClass} data-slot="${slot(facts, "tooltipName")}"></span>
`;
}

function printTooltipValue(facts: ChartSurfaceFacts): string {
  return `---
import type { ${propsName(facts, "tooltipValue")} } from "./${names(facts).markup}";

type Props = ${propsName(facts, "tooltipValue")};

${chartComment(facts.parts.tooltipValue.doc!, "line")}
const { "data-slot": _dataSlot, ...rest } = Astro.props;
---

<span {...rest} data-slot="${slot(facts, "tooltipValue")}"></span>
`;
}

function printLegend(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { visibleKeys } from "${facts.runtime.importSource}";
import { type ChartLegendProps, chartRegion, renderConfiguredChartLegend } from "./${n.markup}";

type Props = ChartLegendProps;

const {
  hideIcon = ${chartPropDefault(facts, "legend", "hideIcon")},
  config,
  visible,
  role = "group",
  "aria-label": ariaLabel = "${facts.defaults.legendAriaLabel}",
  // The part owns its data-slot, as in every framework.
  "data-slot": _dataSlot,
  ...rest
} = Astro.props;

const children = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
const region = chartRegion("legend", children, { hideIcon });
// Inside a chart Root, the Root fills the legend. A legend with \`config\` fills itself, and a Root
// renders it again with the Root's passive state and rich slots.
const html = config ? renderConfiguredChartLegend(region, config, visibleKeys(config, visible)) : region;
---

<div {...rest} role={role} aria-label={ariaLabel} data-slot="${slot(facts, "legend")}">
  <Fragment set:html={html} />
</div>
`;
}

function printLegendItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "legendItems")}, chartRegion } from "./${n.markup}";

type Props = ${propsName(facts, "legendItems")};

// The chart Root renders these children once per config key.
const children = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
---

<Fragment set:html={chartRegion("legend-items", children)} />
`;
}

function printLegendItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "legendItem")}, chartRegion } from "./${n.markup}";

type Props = ${propsName(facts, "legendItem")};

const { value, interactive, ...attrs } = Astro.props;

// A legend toggle for one config key. A click listener that calls \`preventDefault()\` cancels the
// toggle. The chart Root renders the element with the key and its visibility state.
const children = Astro.slots.has("default") ? await Astro.slots.render("default") : "";
---

<Fragment set:html={chartRegion("legend-item", children, { value, interactive, attrs })} />
`;
}

function printLegendSwatch(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "legendSwatch")}, chartMarker } from "./${n.markup}";

type Props = ${propsName(facts, "legendSwatch")};

// The series color swatch. The chart Root leaves it out when the legend shows the config icon.
---

<Fragment set:html={chartMarker("legend-swatch", { attrs: Astro.props })} />
`;
}

function printLegendIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "legendIcon")}, chartMarker } from "./${n.markup}";

type Props = ${propsName(facts, "legendIcon")};

// The config icon of a legend item. The chart Root leaves it out without an icon or with \`hideIcon\`.
---

<Fragment set:html={chartMarker("legend-icon", { attrs: Astro.props })} />
`;
}

function printLegendLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return `---
import { type ${propsName(facts, "legendLabel")}, chartMarker } from "./${n.markup}";

type Props = ${propsName(facts, "legendLabel")};

// The config label of a legend item: a \`label-<key>\` slot, or its plain text.
---

<Fragment set:html={chartMarker("legend-label", { attrs: Astro.props })} />
`;
}

function printSpecPart(facts: ChartSurfaceFacts, part: ChartSpecPartName): string {
  const n = names(facts);
  const spec = facts.specParts[part];
  return `---
import { type ${spec.exportName}Props, chartSpecPart } from "./${n.markup}";

type Props = ${spec.exportName}Props;

${chartComment(`${spec.doc} The chart Root reads this part in source order. It renders nothing.`, "line")}
---

<Fragment set:html={chartSpecPart("${spec.kind}", Astro.props)} />
`;
}

function printLifecycle(facts: ChartSurfaceFacts): string {
  return `---
// Rendered only by interactive charts, so a static chart page loads no chart script.
---

<script>
  import { startCharts } from "${facts.runtime.importSource}";

  startCharts();
</script>
`;
}

function printMarkup(facts: ChartSurfaceFacts): string {
  return `import {
  assertChartSpecWire,
  type ChartFormat,
  type ChartIcon,
  type ChartInput,
  type ChartModule,
  type ChartPart,
  type ChartSource,
  type ChartSpec,
  type ChartSpecOptions,
  type CreateChartOptions,
  buildChartSpec,
  chartStyle,
  colorVariable,
  configText,
  isChartIcon,
  type NativeHostOptions,
  prerenderChart,
  type ChartConfig as RuntimeChartConfig,
  type TooltipContentOptions,
} from "${facts.runtime.importSource}";
import type { HTMLAttributes } from "astro/types";

/** A value type that a chart axis accepts. */
export type ChartValue = ChartModule extends ChartModule<any, any, infer X, any> ? X : never;

/** A static native chart definition. */
export type ChartDefinition<
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = NonNullable<CreateChartOptions<unknown, D, X, Y>["definition"]>;

/**
 * Astro chart config. Labels are text and icons are portable icons. Rich labels and icons come from
 * the Root \`label-<key>\` and \`icon-<key>\` slots.
 */
export type ChartConfig = RuntimeChartConfig<string, ChartIcon>;

type ChartRootCommonProps<D, X extends ChartValue, Y extends ChartValue> = Omit<
  HTMLAttributes<"div">,
  "id"
> & {
  /** Unique chart id. It scopes config colors and prefixes native ids. Generated when omitted. */
  id?: string;
  config: ChartConfig;
  params?: Record<string, unknown>;
  /** Native chart theme passed to the chart module context. */
  theme?: ChartInput["theme"];
  /** Native host options. Callbacks run on the server only; register them in the chart module. */
  host?: NativeHostOptions<NoInfer<D>, NoInfer<X>, NoInfer<Y>>;
  /** Sets the native \`definition.tooltip\` to false. */
  disableTooltip?: boolean;
${printChartSpecOptionFields(facts, "root")}
${astroOnlyFields(facts, "root")}
};

export type ChartRootSourceProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ChartRootCommonProps<D, X, Y> & {
  /** A chart module. An inline factory renders, but only a module starts in the browser. */
  chart: ChartSource<T, D, X, Y>;
  definition?: never;
  data: readonly T[];
  /**
   * Initial visible keys. A legend toggle commits on its own and dispatches the cancelable
   * \`starwind-chart:visible-change\` event. For a silent update, call the controller
   * \`setVisible(next, { emit: false })\`.
   */
  visible?: readonly string[];
  /** Initial visible keys when \`visible\` is omitted. Omit both to show every config key. */
  defaultVisible?: readonly string[];
};

export type ChartRootSpecProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ChartRootCommonProps<D, X, Y> & {
  chart?: never;
  definition?: never;
  /** The data rows. Chart spec parts in the default slot, such as a bar and an x axis, draw them. */
  data: readonly T[];
  /** Initial visible keys. Omit it and \`defaultVisible\` to show every config key. */
  visible?: readonly string[];
  /** Initial visible keys when \`visible\` is omitted. */
  defaultVisible?: readonly string[];
};

export type ChartRootDefinitionProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ChartRootCommonProps<D, X, Y> & {
  /** A static native definition. It owns its visibility, so the legend is passive. */
  definition: ChartDefinition<D, X, Y>;
  chart?: never;
  data?: readonly T[];
  visible?: never;
  defaultVisible?: never;
};

export type ChartRootProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> =
  | ChartRootSourceProps<T, D, X, Y>
  | ChartRootDefinitionProps<T, D, X, Y>
  | ChartRootSpecProps<T, D, X, Y>;

/**
 * Tooltip content options. Formatters are \`ChartFormat\` objects, because functions cannot travel
 * from the server. Function formatters belong in the chart module's \`domPresentation\`. \`T\` is
 * the datum type of those formatters.
 */
export type ChartTooltipContentProps<T = unknown> = HTMLAttributes<"div"> &
  Omit<TooltipContentOptions<string, T>, "formatter" | "labelFormatter" | "hideIcon"> & {
    /** Formats each row value. The row keeps its indicator and name. */
    formatter?: ChartFormat;
    /** Formats the heading. */
    labelFormatter?: ChartFormat;
  };

export type ChartLegendProps = Omit<HTMLAttributes<"div">, "children"> & {
${propFields(facts, "legend")}
};

export type ${propsName(facts, "style")} = Omit<HTMLAttributes<"style">, "children">;

export type ${propsName(facts, "surface")} = Omit<HTMLAttributes<"div">, "children"> & {
  /** Tooltip body HTML. It wins over a registered Tooltip. */
  tooltip?: string;
  /** The component that renders the tooltip body when no Tooltip is registered. */
  fallbackTooltip?: (props: Record<string, unknown>) => unknown;
${chartComment(chartProp(facts, "surface", "nativeTooltip").description!, "block", "  ")}
  nativeTooltip?: boolean;
};

/** Tooltip content goes in the default slot. */
export type ${propsName(facts, "tooltip")} = {
${printChartSpecOptionFields(facts, "tooltip")}
};

export type ${propsName(facts, "tooltipLabel")} = Omit<HTMLAttributes<"div">, "children">;

/** The row template goes in the default slot. */
export type ${propsName(facts, "tooltipItems")} = Record<never, never>;

export type ${propsName(facts, "tooltipItem")} = HTMLAttributes<"div"> & {
${propFields(facts, "tooltipItem")}
};

export type ${propsName(facts, "tooltipIndicator")} = Omit<HTMLAttributes<"span">, "children">;

export type ${propsName(facts, "tooltipIcon")} = { class?: string };

export type ${propsName(facts, "tooltipName")} = Omit<HTMLAttributes<"span">, "children"> & {
${propFields(facts, "tooltipName")}
};

export type ${propsName(facts, "tooltipValue")} = Omit<HTMLAttributes<"span">, "children">;

/** The item template goes in the default slot. */
export type ${propsName(facts, "legendItems")} = Record<never, never>;

export type ${propsName(facts, "legendItem")} = Omit<HTMLAttributes<"button">, "type" | "value"> & {
${propFields(facts, "legendItem")}
};

export type ${propsName(facts, "legendSwatch")} = Omit<HTMLAttributes<"span">, "children">;

export type ${propsName(facts, "legendIcon")} = Omit<HTMLAttributes<"span">, "children">;

export type ${propsName(facts, "legendLabel")} = Omit<HTMLAttributes<"span">, "children">;

${printChartSpecPartTypes(facts, "astro", "ChartFormat")}

const MARKER_PREFIX = "sw-chart:";
const MARKER = /<!--(\\/?)sw-chart:([a-z-]+)(?: ([^\\s>]*))?-->/g;
const TOOLTIP_NATIVE = "<!--sw-chart:tooltip-native-->";
const TOOLTIP_REGISTRATION_START = "<template data-sw-chart-tooltip-registration>";
const TOOLTIP_REGISTRATION_END = "</template>";
const TOOLTIP_ICON = /<!--sw-chart:tooltip-icon ([^\\s>]*)-->/g;

function encode(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value ?? {})).replace(/-/g, "%2D");
}

function decode(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A part marker that the chart Root replaces with markup built from chart data. */
export function chartMarker(name: string, data?: unknown): string {
  return \`<!--\${MARKER_PREFIX}\${name}\${data === undefined ? "" : \` \${encode(data)}\`}-->\`;
}

export function chartMarkerEnd(name: string): string {
  return \`<!--/\${MARKER_PREFIX}\${name}-->\`;
}

/** Wraps rendered children in a part marker pair. */
export function chartRegion(name: string, html: string, data?: unknown): string {
  return \`\${chartMarker(name, data)}\${html}\${chartMarkerEnd(name)}\`;
}

${printSpecPartHelpers(facts)}

/**
 * Wraps Tooltip content in an inert template, so it renders nothing outside a chart Root. The
 * region marker carries the Tooltip's defined chart-level options, such as \`cursor\`, and the
 * chart Root removes the marker.
 */
export function chartTooltipRegistration(html: string, options: ChartSpecOptions = {}): string {
  const defined = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  return chartRegion(
    "tooltip",
    \`\${TOOLTIP_REGISTRATION_START}\${html}\${TOOLTIP_REGISTRATION_END}\`,
    Object.keys(defined).length > 0 ? defined : undefined,
  );
}

/** The Surface marker with its tooltip override and native body markers. */
export function chartSurfaceMarker(
  attrs: Record<string, unknown>,
  options: { nativeTooltip: boolean; tooltip?: string },
): string {
  const override =
    !options.nativeTooltip && options.tooltip && options.tooltip.trim() !== ""
      ? chartRegion("tooltip-override", options.tooltip)
      : "";
  return \`\${chartMarker("surface", attrs)}\${options.nativeTooltip ? TOOLTIP_NATIVE : ""}\${override}\`;
}

export const CHART_TOOLTIP_FALLBACK_START = chartMarker("tooltip-fallback");
export const CHART_TOOLTIP_FALLBACK_END = chartMarkerEnd("tooltip-fallback");

/** Moves the TooltipIcon class into the tooltip template options, where the Runtime reads it. */
export function extractChartTooltipIconClass(html: string): { html: string; iconClass?: string } {
  let iconClass: string | undefined;
  const result = html.replace(TOOLTIP_ICON, (_match, data: string) => {
    if (iconClass === undefined) {
      const value = decode(data).class;
      iconClass = typeof value === "string" ? value : "";
    }
    return "";
  });
  return iconClass === undefined ? { html: result } : { html: result, iconClass };
}

export function escapeChartHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleText(value: unknown): string {
  if (value == null || value === false) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  return Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry != null && entry !== false && entry !== "")
    .map(
      ([property, entry]) =>
        \`\${property.startsWith("--") ? property : property.replace(/[A-Z]/g, (letter) => \`-\${letter.toLowerCase()}\`)}:\${String(entry)}\`,
    )
    .join(";");
}

function mergeStyle(base: string, value: unknown): string {
  return [base, styleText(value)].filter(Boolean).join(";");
}

const HTML_BOOLEAN_ATTRIBUTE =
  /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|inert|itemscope|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected)$/i;

/**
 * Serializes attributes as Astro does. HTML boolean attributes render the name for \`true\` and
 * nothing for \`false\`. Other booleans render as text, so \`aria-hidden={false}\` gives "false".
 * Nullish values omit the attribute.
 */
export function chartAttributes(attrs: Record<string, unknown>): string {
  let output = "";
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || !/^[^\\s"'<>/=]+$/.test(name)) continue;
    if (typeof value === "boolean" && HTML_BOOLEAN_ATTRIBUTE.test(name)) {
      if (value) output += \` \${name}\`;
      continue;
    }
    output += \` \${name}="\${escapeChartHtml(name === "style" ? styleText(value) : String(value))}"\`;
  }
  return output;
}

/** Portable icon data as SVG markup. No markup strings are parsed. */
export function chartIconMarkup(icon: unknown): string {
  if (!isChartIcon(icon)) return "";
  const paths = icon.paths.map((d) => \`<path d="\${escapeChartHtml(d)}"></path>\`).join("");
  return \`<svg viewBox="\${escapeChartHtml(icon.viewBox ?? "0 0 24 24")}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em" aria-hidden="true" focusable="false">\${paths}</svg>\`;
}

type MarkerNode = string | { name: string; data: Record<string, unknown>; children: MarkerNode[] };

function parseMarkers(html: string, names: (name: string) => boolean): MarkerNode[] {
  const root: MarkerNode[] = [];
  const stack: { name: string; children: MarkerNode[] }[] = [];
  const current = () => stack[stack.length - 1]?.children ?? root;
  let index = 0;
  for (const match of html.matchAll(MARKER)) {
    const [text, closing, name, data] = match;
    if (!names(name!)) continue;
    if (match.index > index) current().push(html.slice(index, match.index));
    index = match.index + text.length;
    if (!closing) {
      const node = { name: name!, data: decode(data), children: [] as MarkerNode[] };
      current().push(node);
      if (!SELF_CLOSING.has(name!)) stack.push(node);
      continue;
    }
    while (stack.length > 0 && stack[stack.length - 1]!.name !== name) stack.pop();
    if (stack.length > 0) stack.pop();
  }
  if (index < html.length) current().push(html.slice(index));
  return root;
}

const SELF_CLOSING = new Set(["legend-swatch", "legend-icon", "legend-label", "style", "surface"]);

/** Chart data that fills the legend parts. */
export interface ChartLegendScope {
  config: ChartConfig;
  /** The config keys that LegendItems lists, in config order. Defaults to every config key. */
  keys?: readonly string[];
  /** Visible config keys, in config order. */
  visible: readonly string[];
  /** Legend items render buttons by default. A passive item renders a span. */
  interactive: boolean;
  /** Writes the legend template that the Runtime uses when config changes in the browser. */
  template: boolean;
  /** Rich label HTML from \`label-<key>\` slots. */
  labels: Record<string, string>;
  /** Icon HTML from \`icon-<key>\` slots. */
  icons: Record<string, string>;
}

type LegendContext = {
  scope: ChartLegendScope;
  hideIcon: boolean;
  key?: string;
  template?: { iconClass?: string; swatchClass?: string; visual: boolean };
};

function legendIcon(scope: ChartLegendScope, key: string): string {
  return scope.icons[key] ?? chartIconMarkup(scope.config[key]?.icon);
}

function legendKey(context: LegendContext, part: string): string {
  if (context.key === undefined)
    throw new Error(\`Chart.\${part} needs a Chart.LegendItem with a value or a Chart.LegendItems parent.\`);
  return context.key;
}

function renderLegendNodes(nodes: MarkerNode[], context: LegendContext): string {
  return nodes.map((node) => (typeof node === "string" ? node : renderLegendNode(node, context))).join("");
}

function renderLegendNode(
  node: Exclude<MarkerNode, string>,
  context: LegendContext,
): string {
  const { scope } = context;
  const attrs = (node.data.attrs ?? {}) as Record<string, unknown>;
  switch (node.name) {
    case "legend":
      return renderLegendNodes(node.children, { ...context, hideIcon: node.data.hideIcon === true });
    case "legend-config": {
      // Inside a Root, a legend with config keeps its own keys and visibility, and takes the
      // Root's passive state and rich label and icon slots, the same as a legend without config.
      const data = node.data as { config?: ChartConfig; visible?: string[]; region?: string };
      return renderChartLegend(typeof data.region === "string" ? data.region : "", {
        config: data.config ?? {},
        visible: data.visible ?? [],
        interactive: scope.interactive,
        template: false,
        labels: scope.labels,
        icons: scope.icons,
      });
    }
    case "legend-items": {
      const items = (scope.keys ?? Object.keys(scope.config))
        .map((key) => renderLegendNodes(node.children, { ...context, key }))
        .join("");
      if (!scope.template || !scope.interactive) return items;
      const template = { visual: false } as NonNullable<LegendContext["template"]>;
      const prototype = renderLegendNodes(node.children, { ...context, template });
      const templateAttrs = chartAttributes({
        "data-sw-chart-legend-template": "",
        "data-hide-icon": context.hideIcon ? "" : undefined,
        "data-icon-class": template.iconClass,
        "data-swatch-class": template.swatchClass,
      });
      return \`\${items}<template\${templateAttrs}>\${prototype}</template>\`;
    }
    case "legend-item": {
      if (context.template) {
        const { "aria-label": _label, ...rest } = attrs;
        return \`<button\${chartAttributes({ ...rest, type: "button", "data-sw-chart-legend-item": "", "data-slot": "${slot(facts, "legendItem")}" })}>\${renderLegendNodes(node.children, context)}</button>\`;
      }
      const value = typeof node.data.value === "string" ? node.data.value : context.key;
      if (value === undefined)
        throw new Error(${JSON.stringify(chartLegendKeyMessage(facts))});
      colorVariable(value);
      const entry = scope.config[value];
      const rich = scope.labels[value] !== undefined;
      const ariaLabel = attrs["aria-label"] ?? (rich ? configText(entry, value) : undefined);
      const children = renderLegendNodes(node.children, { ...context, key: value });
      const interactive =
        typeof node.data.interactive === "boolean" ? node.data.interactive : scope.interactive;
      if (!interactive) {
        return \`<span\${chartAttributes({ id: attrs.id, class: attrs.class, style: attrs.style, title: attrs.title, "aria-label": ariaLabel, "data-key": value, "data-slot": "${slot(facts, "legendItem")}" })}>\${children}</span>\`;
      }
      const on = scope.visible.includes(value);
      return \`<button\${chartAttributes({
        ...attrs,
        type: "button",
        "aria-label": ariaLabel,
        "aria-pressed": String(on),
        "data-state": on ? "on" : "off",
        "data-key": value,
        "data-slot": "${slot(facts, "legendItem")}",
        "data-sw-chart-legend-item": value,
      })}>\${children}</button>\`;
    }
    case "legend-swatch": {
      if (context.template) {
        context.template.swatchClass = typeof attrs.class === "string" ? attrs.class : "";
        if (context.template.visual) return "";
        context.template.visual = true;
        const { class: _class, style: _style, ...rest } = attrs;
        return \`<span\${chartAttributes({ ...rest, "data-slot": "${slot(facts, "legendSwatch")}", "aria-hidden": "true" })}></span>\`;
      }
      const key = legendKey(context, "LegendSwatch");
      if (legendIcon(scope, key) && !context.hideIcon) return "";
      return \`<span\${chartAttributes({ ...attrs, style: mergeStyle(\`background:var(\${colorVariable(key)})\`, attrs.style), "data-slot": "${slot(facts, "legendSwatch")}", "aria-hidden": "true" })}></span>\`;
    }
    case "legend-icon": {
      if (context.template) {
        context.template.iconClass = typeof attrs.class === "string" ? attrs.class : "";
        if (context.template.visual) return "";
        context.template.visual = true;
        const { class: _class, style: _style, ...rest } = attrs;
        return \`<span\${chartAttributes({ ...rest, "data-slot": "${slot(facts, "legendSwatch")}", "aria-hidden": "true" })}></span>\`;
      }
      const key = legendKey(context, "LegendIcon");
      const icon = legendIcon(scope, key);
      if (!icon || context.hideIcon) return "";
      return \`<span\${chartAttributes({ ...attrs, style: mergeStyle(\`color:var(\${colorVariable(key)})\`, attrs.style), "data-slot": "${slot(facts, "legendIcon")}", "aria-hidden": "true" })}>\${icon}</span>\`;
    }
    case "legend-label": {
      if (context.template)
        return \`<span\${chartAttributes({ ...attrs, "data-slot": "${slot(facts, "legendLabel")}" })}></span>\`;
      const key = legendKey(context, "LegendLabel");
      const label = scope.labels[key] ?? escapeChartHtml(configText(scope.config[key], key));
      return \`<span\${chartAttributes({ ...attrs, "data-slot": "${slot(facts, "legendLabel")}" })}>\${label}</span>\`;
    }
    default:
      return renderLegendNodes(node.children, context);
  }
}

/**
 * Fills a legend that takes \`config\`. The marker keeps its config and source, so that a chart Root
 * can render it again with its own passive state and rich slots. Outside a Root the marker is an
 * inert comment.
 */
export function renderConfiguredChartLegend(
  region: string,
  config: ChartConfig,
  visible: readonly string[],
): string {
  const html = renderChartLegend(region, {
    config,
    visible,
    interactive: true,
    template: false,
    labels: {},
    icons: {},
  });
  return chartRegion("legend-config", html, { config, visible, region });
}

/** Fills legend part markers with config keys, visibility, labels and icons. */
export function renderChartLegend(html: string, scope: ChartLegendScope): string {
  if (!html.includes(\`<!--\${MARKER_PREFIX}legend\`)) return html;
  const nodes = parseMarkers(html, (name) => name.startsWith("legend"));
  return renderLegendNodes(nodes, { scope, hideIcon: false });
}

const TOOLTIP_KINDS = new Set(["tooltip", "tooltip-override", "tooltip-fallback"]);

/** Tooltip regions render their content in place inside a tooltip body, as in React. */
function renderTooltipInBody(nodes: MarkerNode[]): string {
  return nodes
    .map((node) => (typeof node === "string" ? node : unwrapTooltipRegion(node)))
    .join("");
}

function unwrapTooltipRegion(node: Exclude<MarkerNode, string>): string {
  const content = renderTooltipInBody(node.children);
  if (
    node.name === "tooltip" &&
    content.startsWith(TOOLTIP_REGISTRATION_START) &&
    content.endsWith(TOOLTIP_REGISTRATION_END)
  )
    return content.slice(TOOLTIP_REGISTRATION_START.length, -TOOLTIP_REGISTRATION_END.length);
  return content;
}

/**
 * Keeps one tooltip body: the Surface \`tooltip\` override, then the first registered Tooltip, then
 * the Surface fallback. \`nativeTooltip\` keeps none, so TanStack renders its native body. The body
 * becomes one static template, so all of it renders inside the tooltip. The Runtime fills a
 * TooltipContent template inside it.
 */
export function resolveChartTooltips(html: string): string {
  const native = html.includes(TOOLTIP_NATIVE);
  const nodes = parseMarkers(html.split(TOOLTIP_NATIVE).join(""), (name) => TOOLTIP_KINDS.has(name));
  const regions = nodes.filter((node) => typeof node !== "string");
  const pick = (kind: string) => regions.find((region) => region.name === kind);
  const winner = native
    ? undefined
    : (pick("tooltip-override") ?? pick("tooltip") ?? pick("tooltip-fallback"));
  return nodes
    .map((node) => {
      if (typeof node === "string") return node;
      if (node !== winner) return "";
      const content = unwrapTooltipRegion(node);
      if (content.trim() === "") return "";
      return "<template data-sw-chart-tooltip data-sw-chart-tooltip-static>" + content + "</template>";
    })
    .join("");
}

export interface ChartContentOptions<T, D, X extends ChartValue, Y extends ChartValue> {
  id: string;
  chart?: ChartSource<T, D, X, Y>;
  definition?: ChartDefinition<D, X, Y>;
  input: ChartInput<T>;
  host?: NativeHostOptions<D, X, Y>;
  disableTooltip: boolean;
  /** True without chart parts, a chart and a definition. The surface stays empty. */
  empty?: boolean;
  legend: ChartLegendScope;
}

/** Replaces the Style, Surface, Tooltip and legend markers in a chart Root's rendered children. */
export function renderChartContent<T, D, X extends ChartValue, Y extends ChartValue>(
  html: string,
  options: ChartContentOptions<T, D, X, Y>,
): string {
  let surface: { markup: string; style: string } | undefined =
    options.empty ? { markup: "", style: "" } : undefined;
  const prerender = () => {
    if (!surface) {
      const result = prerenderChart(options.chart, options.input, {
        id: options.id,
        host: options.host,
        definition: options.definition,
        tooltipDisabled: options.disableTooltip,
      });
      surface = { markup: result.markup, style: result.surfaceStyle };
    }
    return surface;
  };
  const filled = html.replace(MARKER, (match, closing: string, name: string, data?: string) => {
    if (closing) return match;
    if (name === "style") {
      // The Runtime validates the id, config keys and colors before it writes CSS.
      const css = chartStyle(options.id, options.input.config);
      return \`<style\${chartAttributes({ ...decode(data), "data-slot": "${slot(facts, "style")}" })}>\${css}</style>\`;
    }
    if (name === "surface") {
      const attrs = decode(data);
      const result = prerender();
      return \`<div\${chartAttributes({
        ...attrs,
        style: mergeStyle(result.style, attrs.style),
        "data-sw-chart-surface": "",
        "data-slot": "${slot(facts, "surface")}",
      })}>\${result.markup}</div>\`;
    }
    return match;
  });
  return renderChartLegend(resolveChartTooltips(filled), options.legend);
}

/** The slots of an Astro component, as \`Astro.slots\` gives them. */
export interface ChartSlots {
  has(name: string): boolean;
  render(name: string): Promise<string>;
}

/**
 * Rich label and icon HTML per config key, for a Root and for a wrapper that renders its own
 * \`label-<key>\` and \`icon-<key>\` slots. A slot wins over the prop value. A slot whose condition is
 * false renders nothing, so it keeps the prop or config value. Blank prop values drop.
 */
export async function ${names(facts).collectViews}(
  slots: ChartSlots,
  config: ChartConfig,
  labels: Record<string, string> = {},
  icons: Record<string, string> = {},
): Promise<{ labels: Record<string, string>; icons: Record<string, string> }> {
  const views = { labels: { ...labels }, icons: { ...icons } };
  for (const key of Object.keys(config)) {
    for (const [kind, target] of [["label", views.labels], ["icon", views.icons]] as const) {
      if (!slots.has(\`\${kind}-\${key}\`)) continue;
      const html = await slots.render(\`\${kind}-\${key}\`);
      if (html.trim()) target[key] = html;
    }
  }
  for (const target of [views.labels, views.icons])
    for (const [key, html] of Object.entries(target)) if (!html.trim()) delete target[key];
  return views;
}

/** Client templates for rich labels and icons, which the Runtime copies into the tooltip and legend. */
export function chartViewTemplates(
  config: ChartConfig,
  labels: Record<string, string>,
  icons: Record<string, string>,
): string {
  return Object.keys(config)
    .map((key) => {
      const label =
        labels[key] === undefined
          ? ""
          : \`<template\${chartAttributes({ "data-sw-chart-label": key, "data-text": configText(config[key], key) })}>\${labels[key]}</template>\`;
      const icon =
        icons[key] === undefined
          ? ""
          : \`<template\${chartAttributes({ "data-sw-chart-icon": key })}>\${icons[key]}</template>\`;
      return label + icon;
    })
    .join("");
}
`;
}

/** The spec part marker, its collector and the format checks. */
function printSpecPartHelpers(facts: ChartSurfaceFacts): string {
  return `${printChartSpecPartPropsTable(facts, "astro")}
const SPEC_PART = /<!--sw-chart:spec-part ([^\\s>]*)-->/g;

/**
 * A chart spec part marker. The part keeps only its own props. A function formatter fails here,
 * because a function cannot travel from the server.
 */
export function chartSpecPart(kind: ChartPart["kind"], props: Record<string, unknown>): string {
  const part: Record<string, unknown> = { kind };
  for (const name of CHART_SPEC_PART_PROPS[kind]) if (props[name] !== undefined) part[name] = props[name];
  assertChartSpecWire({ parts: [part as unknown as ChartPart] });
  return chartMarker("spec-part", part);
}

/** The chart-level options that a Tooltip registration carries. */
const TOOLTIP_OPTION_NAMES = ${JSON.stringify(chartSpecOptions(facts, "tooltip").map(({ name }) => name))} as const;

/**
 * Removes the spec part markers from a Root's rendered children and collects the parts in order.
 * The Root's own options come first, then the options of each chart-level Tooltip in order. A
 * Tooltip inside a tooltip body or a Surface \`tooltip\` sets nothing. Each Tooltip names all of
 * its options, so the first one, which supplies the tooltip body, decides them.
 */
export function ${names(facts).collectSpec}(
  html: string,
  rootOptions?: ChartSpecOptions,
): { html: string; spec?: ChartSpec } {
  const parts: ChartPart[] = [];
  const rest = html.replace(SPEC_PART, (_match, data: string) => {
    parts.push(decode(data) as unknown as ChartPart);
    return "";
  });
  const tooltips = parseMarkers(rest, (name) => TOOLTIP_KINDS.has(name)).flatMap((node) =>
    typeof node !== "string" && node.name === "tooltip"
      ? [Object.fromEntries(TOOLTIP_OPTION_NAMES.map((name) => [name, node.data[name]])) as ChartSpecOptions]
      : [],
  );
  const spec = buildChartSpec(parts, rootOptions, ...tooltips);
  return spec ? { html: rest, spec } : { html: rest };
}

/** Throws for a function formatter, which cannot travel from the server. */
export function assertChartFormat(name: string, value: unknown): void {
  if (typeof value === "function")
    throw new TypeError(
      \`\${name} is a function, and a function cannot reach the browser. Use a ChartFormat object such as { number: { maximumFractionDigits: 0 } }, or set the formatter in the chart module's domPresentation.\`,
    );
}`;
}
