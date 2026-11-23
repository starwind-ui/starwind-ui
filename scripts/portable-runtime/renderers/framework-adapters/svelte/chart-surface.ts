import {
  chartDefinitionGuard,
  chartLegendToggle,
  chartModelHelpers,
  chartPrerender,
  chartRootInputs,
  chartRootState,
  chartRootStateValue,
  chartSurfaceHelpers,
  chartSurfaceLifecycle,
  chartTooltipAccessibility,
  chartTooltipBody,
  chartTooltipLayoutOptions,
  chartTooltipRegistry,
  chartTooltipResolution,
  chartVisibleModel,
  chartVisibleRequests,
} from "../../shared-recipes/chart/recipe.js";
import {
  type ChartSurfaceComponentProjection,
  type ChartSurfaceFacts,
  type ChartSurfaceIndexProjection,
  type ChartSurfacePartName,
  type ChartTypeWords,
  chartComment,
  chartNames,
  chartPartProps,
  chartProp,
  chartPropType,
  chartPublicTypes,
  chartSlot,
} from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import type {
  AdapterComponentFile,
  AdapterFamilyHelperProjection,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { svelteChartOperations } from "./recipe-chart-operations.js";

/**
 * Svelte target home for the chart Specialized Adapter Spec. Every part is a Svelte 5 component on
 * the Runtime controller. Shared types, context keys and getters live in one context module. One
 * internal provider component gives each tooltip row, legend key and tooltip body to the snippet
 * content, because Svelte context belongs to a component.
 */

type SvelteChartHelperProjection = {
  facts: ChartSurfaceFacts;
  kind: "svelte-chart-context" | "svelte-chart-provider";
};

export function isSvelteChartSurfaceProjection(family: unknown): boolean {
  return (family as { kind?: string } | undefined)?.kind === "chart-surface";
}

function isSvelteChartHelperProjection(family: unknown): family is SvelteChartHelperProjection {
  const kind = (family as { kind?: string } | undefined)?.kind;
  return kind === "svelte-chart-context" || kind === "svelte-chart-provider";
}

/** Adds the shared chart context module and the internal provider before the chart index. */
export function projectSvelteChartSurfaceOutput(model: AdapterOutputModel): AdapterOutputModel {
  const index = model.files.find(
    (file) => file.kind === "index" && isSvelteChartSurfaceProjection(file.family),
  );
  if (!index || index.kind !== "index") return model;
  const facts = (index.family as unknown as ChartSurfaceIndexProjection).facts;
  const directory = index.path.slice(0, index.path.lastIndexOf("/"));
  const helper = (
    kind: SvelteChartHelperProjection["kind"],
    name: string,
    fileName: string,
  ): AdapterHelperFile => ({
    body: { code: "" } as AdapterHelperFile["body"],
    family: { facts, kind } as unknown as AdapterFamilyHelperProjection,
    imports: [],
    kind: "helper",
    name,
    path: `${directory}/${fileName}`,
    target: "svelte",
  });
  const n = names(facts);
  const files = [...model.files];
  files.splice(
    files.indexOf(index),
    0,
    helper("svelte-chart-context", n.context, `${n.context}.ts`),
    helper("svelte-chart-provider", n.provider, `${n.provider}.svelte`),
  );
  return { files };
}

export function printSvelteChartSurfaceComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const { facts, part } = file.component.family as unknown as ChartSurfaceComponentProjection;
  return { contents: printPart(facts, part), path: `${file.path}.svelte` };
}

export function printSvelteChartSurfaceHelper(file: AdapterHelperFile): AdapterPrintedFile | null {
  const family: unknown = file.family;
  if (!isSvelteChartHelperProjection(family)) return null;
  return {
    contents:
      family.kind === "svelte-chart-context"
        ? `${printContext(family.facts)}`
        : printProvider(family.facts),
    path: file.path,
  };
}

function names(facts: ChartSurfaceFacts) {
  const d = facts.displayName;
  const root = facts.parts.root.exportName;
  return {
    ...chartNames(facts),
    bodyState: `${d}TooltipBodyState`,
    contentState: `${d}TooltipContentState`,
    keyState: `${d}LegendKeyState`,
    legendState: `${d}LegendState`,
    rowState: `${d}TooltipRowState`,
    setContent: `set${d}TooltipContent`,
    setLegend: `set${d}Legend`,
    setRoot: `set${root}`,
  };
}

const slot = chartSlot;

function propsName(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return `${facts.parts[part].exportName}Props`;
}

function contextImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `  import { ${members.join(", ")} } from "./${names(facts).context}.js";`;
}

/**
 * Indents a script by bracket depth, because recipe text arrives without nested indents. All
 * brackets that open on one line add one level. A line that starts with a closing bracket and a
 * line that continues an assignment, a ternary or a braceless statement shift by one level.
 */
function reindent(script: string): string {
  const open: number[] = [];
  let continues = false;
  let continued = false;
  return script
    .split("\n")
    .map((raw) => {
      const line = raw.trim();
      if (!line) return "";
      const comment = /^(\/\/|\/\*|\*)/.test(line);
      const code = comment
        ? ""
        : line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*$/g, "");
      // A ternary branch sits one level deeper than the condition lines it follows.
      const extra = /^[?:] /.test(line) ? (continued ? 2 : 1) : continues ? 1 : 0;
      const depth = open.length - (/^[)\]}]/.test(line) ? 1 : 0) + extra;
      let pending = 0;
      for (const char of code) {
        if ("([{".includes(char)) pending++;
        else if (")]}".includes(char)) {
          if (pending) pending--;
          else if (open.length && --open[open.length - 1]! === 0) open.pop();
        }
      }
      if (pending) open.push(pending);
      if (!comment) continued = extra > 0;
      const tail = code.trimEnd();
      if (!comment)
        continues =
          !pending &&
          (/[=?:]$/.test(tail) ||
            /^(?:(?:else )?if|for|while) \(.*\)$|^else$/.test(tail) ||
            (continues && /(&&|\|\|)$/.test(tail)));
      return `${"  ".repeat(Math.max(0, depth) + 1)}${line}`;
    })
    .join("\n");
}

function component(script: string, markup: string, generics?: string): string {
  return `<script lang="ts"${generics ? ` generics="${generics}"` : ""}>
${reindent(script.replace(/^\n+|\n+$/g, ""))}
</script>

${markup.replace(/^\n+|\n+$/g, "")}
`;
}

/** Renders a config label, heading or formatter result: text, a number or a snippet. */
const VIEW_SNIPPET = `{#snippet view(value: unknown)}{#if typeof value === "function"}{@render (value as Snippet)()}{:else if typeof value === "string" || typeof value === "number"}{value}{/if}{/snippet}`;

/** Portable icon data renders path nodes. Any other value is a Svelte icon component. */
function iconSnippet(facts: ChartSurfaceFacts): string {
  return `{#snippet icon(value: unknown)}
  {#if ${facts.runtime.helpers.isIcon}(value)}
    <svg
      viewBox={value.viewBox ?? "0 0 24 24"}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >{#each value.paths as d, index (index)}<path {d} />{/each}</svg>
  {:else if value}
    {@const Icon = value as Component}
    <Icon />
  {/if}
{/snippet}`;
}

function refAttachment(facts: ChartSurfaceFacts, part: ChartSurfacePartName, type: string) {
  return facts.parts[part].forwardsRef ? printSvelteRefAttachment(type) : "";
}

function printPart(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
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

function elementProps(element: string): string {
  switch (element) {
    case "button":
      return "HTMLButtonAttributes";
    case "span":
      return "HTMLAttributes<HTMLSpanElement>";
    default:
      return "HTMLAttributes<HTMLDivElement>";
  }
}

function elementType(element: string): string {
  switch (element) {
    case "button":
      return "HTMLButtonElement";
    case "span":
      return "HTMLSpanElement";
    default:
      return "HTMLDivElement";
  }
}

/** Body content is a snippet. A class hook takes the class value of the part element. */
function words(facts: ChartSurfaceFacts, part: ChartSurfacePartName): ChartTypeWords {
  return {
    ChartClass: `${elementProps(facts.parts[part].element ?? "div")}["class"]`,
    ChartContent: "Snippet",
    ChartView: "ChartView",
  };
}

function propType(facts: ChartSurfaceFacts, part: ChartSurfacePartName, name: string): string {
  return chartPropType(chartProp(facts, part, name), words(facts, part));
}

/** The contract props of a part as type fields, each with its doc comment. */
function ownFields(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string[] {
  return chartPartProps(facts, part, "svelte").flatMap((prop) => [
    ...(prop.description ? [chartComment(prop.description, "block", "  ")] : []),
    `  ${prop.name}?: ${chartPropType(prop, words(facts, part))};`,
  ]);
}

/** The part doc as script comment lines. \`more\` adds Svelte detail after the shared text. */
function doc(facts: ChartSurfaceFacts, part: ChartSurfacePartName, more?: string): string {
  return chartComment([facts.parts[part].doc!, more].filter(Boolean).join(" "), "line", "  ");
}

/** Props of a part that renders one element, takes children and forwards a ref callback. */
function partProps(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  options: { children?: boolean; omit?: string[] } = {},
): string {
  const element = facts.parts[part].element ?? "div";
  const omit = ["children", ...(options.omit ?? [])].map((key) => `"${key}"`).join(" | ");
  const fields = [
    ...ownFields(facts, part),
    ...(options.children === false ? [] : ["  children?: Snippet;"]),
    ...(facts.parts[part].forwardsRef
      ? [`  ref?: (element: ${elementType(element)} | null) => void;`]
      : []),
  ];
  return `export type ${propsName(facts, part)} = Omit<${elementProps(element)}, ${omit}> & {\n${fields.join("\n")}\n};`;
}

function printContext(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const v = facts.visibility;
  const d = facts.displayName;
  return `import type {
  ChartConfig as RuntimeChartConfig,
  ChartController,
  ChartInput,
  ChartModule,
  ChartSource,
  ChartToggleOptions,
  ChartVisibleChangeDetails,
  CreateChartOptions,
  NativeHostOptions,
  TooltipItem,
  TooltipLayoutRow,
  TooltipView,
  TooltipViewRow,
} from "${facts.runtime.importSource}";
import { getContext, setContext, type Component, type Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

/** A value type that a chart axis accepts. */
export type ChartValue = ChartModule extends ChartModule<any, any, infer X, any> ? X : never;

/** A static native chart definition. */
export type ChartDefinition<
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = NonNullable<CreateChartOptions<unknown, D, X, Y>["definition"]>;

/** The tooltip body target that the Runtime controller hands to the adapter. */
export type ChartTooltipBody = NonNullable<
  Parameters<NonNullable<CreateChartOptions["onTooltipBodyChange"]>>[0]
>;

/** A Svelte view value: text, a number or a snippet that takes no arguments. */
export type ChartView = string | number | Snippet | null | undefined;

/**
 * Svelte chart config. Rich labels are snippets and need \`text\`. Icons are components or
 * portable icons.
 */
export type ChartConfig = RuntimeChartConfig<Snippet, Component<any>>;

type ${n.root}CommonProps<D, X extends ChartValue, Y extends ChartValue> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "children"
> & {
  /**
   * Unique chart id. It scopes config colors and prefixes native ids. Generated with
   * \`$props.id()\` when omitted, so the server and the client agree.
   */
  id?: string;
  config: ChartConfig;
  params?: Record<string, unknown>;
  /** Native chart theme passed to the chart module context. */
  theme?: ChartInput["theme"];
  /** Native host options such as callbacks and sizing. */
  host?: NativeHostOptions<D, X, Y>;
  /** Sets the native \`definition.tooltip\` to false. */
  disableTooltip?: boolean;
  children?: Snippet;
};

/** A chart module or factory. It follows the visibility model. */
export type ${n.root}SourceProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ${n.root}CommonProps<D, X, Y> & {
  /** A chart module or an inline chart factory. */
  chart: ChartSource<T, D, X, Y>;
  definition?: never;
  data: readonly T[];
  /**
   * Visible keys for \`bind:${v.controlledProp}\` (accepted model). A defined initial value is
   * parent-controlled for the mounted lifetime. An undefined initial value stays local and
   * publishes accepted changes to the binding. An empty array hides every series.
   */
  ${v.controlledProp}?: readonly string[];
  /** Initial visible keys while the model is local. Omit it to show every config key. */
  ${v.defaultProp}?: readonly string[];
  /**
   * Receives each visibility proposal before the cancelable \`${v.domEvent}\` event. Call
   * \`details.cancel()\` to keep the current keys. The binding is written after the change is
   * accepted.
   */
  ${v.callbackProp}?: (visible: string[], details: ChartVisibleChangeDetails) => void;
};

/** A static native definition. It owns its visibility, so the legend is passive. */
export type ${n.root}DefinitionProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ${n.root}CommonProps<D, X, Y> & {
  definition: ChartDefinition<D, X, Y>;
  chart?: never;
  data?: readonly T[];
  ${v.controlledProp}?: never;
  ${v.defaultProp}?: never;
  ${v.callbackProp}?: never;
};

/**
 * Props of ${d}.Root. Use \`chart\` (a chart module or factory) or \`definition\` (a static native
 * definition). A definition owns its visibility, so it rejects \`${v.controlledProp}\`,
 * \`${v.defaultProp}\` and \`${v.callbackProp}\`.
 */
export type ${n.root}Props<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ${n.root}SourceProps<T, D, X, Y> | ${n.root}DefinitionProps<T, D, X, Y>;

export type ${propsName(facts, "style")} = Record<never, never>;

${partProps(facts, "surface", { children: false })}

export type ${propsName(facts, "tooltip")} = {
${ownFields(facts, "tooltip").join("\n")}
};

/** Tooltip content options with shadcn's argument order. \`payload\` is the native datum. */
export type ${propsName(facts, "tooltipContent")}<T = unknown> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> & {
${ownFields(facts, "tooltipContent").join("\n")}
  children?: Snippet;
  ref?: (element: HTMLDivElement | null) => void;
};

${partProps(facts, "tooltipLabel", { children: false })}

export type ${propsName(facts, "tooltipItems")} = {
${ownFields(facts, "tooltipItems").join("\n")}
};

${partProps(facts, "tooltipItem")}

${partProps(facts, "tooltipIndicator", { children: false })}

${partProps(facts, "tooltipIcon", { children: false })}

${partProps(facts, "tooltipName", { children: false })}

${partProps(facts, "tooltipValue", { children: false })}

${partProps(facts, "legend")}

export type ${propsName(facts, "legendItems")} = {
${ownFields(facts, "legendItems").join("\n")}
};

export type ${propsName(facts, "legendItem")} = Omit<
  HTMLButtonAttributes,
  "children" | "type" | "value"
> & {
${ownFields(facts, "legendItem").join("\n")}
  children?: Snippet;
  ref?: (element: HTMLElement | null) => void;
};

${partProps(facts, "legendSwatch", { children: false })}

${partProps(facts, "legendIcon", { children: false })}

${partProps(facts, "legendLabel", { children: false })}

/** One Tooltip registration. The surface renders the first one. */
export interface ${n.entry} {
  readonly content: Snippet | undefined;
}

/** Read-only reactive chart state. Each getter reads rune state, so markup and $derived track it. */
${chartRootState(n.state, n.internalState, n.entry, true)}

/** The tooltip body that the current content renders for. */
export interface ${n.bodyState} {
  readonly body: ChartTooltipBody | null;
}

export interface ${n.contentState} {
  body: ChartTooltipBody;
  heading: unknown;
  hideIndicator: boolean;
  indicator: ${propType(facts, "tooltipContent", "indicator")};
  nested: boolean;
  showLabel: boolean;
  view: TooltipView<ChartView>;
  /** The flags of each row: active, the color marker and the nested heading. */
  rows: TooltipLayoutRow[];
}

export interface ${n.rowState} extends TooltipLayoutRow {
  index: number;
  row: TooltipViewRow<ChartView>;
}

export interface ${n.legendState} {
  readonly hideIcon: boolean;
}

export interface ${n.keyState} {
  readonly key: string;
}

const rootKey = Symbol("starwind-chart-root");
const rootInternalKey = Symbol("starwind-chart-root-internal");
const bodyKey = Symbol("starwind-chart-tooltip-body");
const contentKey = Symbol("starwind-chart-tooltip-content");
const rowKey = Symbol("starwind-chart-tooltip-row");
const legendKey = Symbol("starwind-chart-legend");
const legendKeyKey = Symbol("starwind-chart-legend-key");

export function ${n.setRoot}(state: ${n.state}, internal: ${n.internalState}): void {
  setContext(rootKey, state);
  setContext(rootInternalKey, internal);
}

/** The public chart state: config keys, visible keys and visibility requests. */
export function ${n.useRoot}(): ${n.state} {
  const state = getContext<${n.state} | undefined>(rootKey);
  if (!state) throw new Error("${d} parts must be rendered inside ${d}.Root.");
  return state;
}

export function ${n.useOptionalInternalRoot}(): ${n.internalState} | null {
  return getContext<${n.internalState} | undefined>(rootInternalKey) ?? null;
}

export function ${n.useInternalRoot}(): ${n.internalState} {
  const state = getContext<${n.internalState} | undefined>(rootInternalKey);
  if (!state) throw new Error("${d} parts must be rendered inside ${d}.Root.");
  return state;
}

export function set${d}TooltipBody(state: ${n.bodyState}): void {
  setContext(bodyKey, state);
}

/** The tooltip body that the current content renders for. It is \`null\` outside a body. */
export function ${n.useBody}(): ${n.bodyState} | null {
  return getContext<${n.bodyState} | undefined>(bodyKey) ?? null;
}

export function ${n.setContent}(state: { readonly state: ${n.contentState} | null }): void {
  setContext(contentKey, state);
}

export function ${n.useContent}(): { readonly state: ${n.contentState} | null } | null {
  return getContext<{ readonly state: ${n.contentState} | null } | undefined>(contentKey) ?? null;
}

export function set${d}TooltipRow(state: { readonly state: ${n.rowState} }): void {
  setContext(rowKey, state);
}

export function ${n.useRow}(): { readonly state: ${n.rowState} } | null {
  return getContext<{ readonly state: ${n.rowState} } | undefined>(rowKey) ?? null;
}

export function ${n.setLegend}(state: ${n.legendState}): void {
  setContext(legendKey, state);
}

export function ${n.useLegend}(): ${n.legendState} {
  return getContext<${n.legendState} | undefined>(legendKey) ?? { hideIcon: false };
}

export function set${d}LegendKey(state: ${n.keyState}): void {
  setContext(legendKeyKey, state);
}

export function ${n.useKey}(): ${n.keyState} | null {
  return getContext<${n.keyState} | undefined>(legendKeyKey) ?? null;
}

export type { TooltipItem };
`;
}

function printProvider(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const d = facts.displayName;
  return component(
    `
  // Internal part. It gives one tooltip row, one legend key or the tooltip body to its content,
  // because Svelte context belongs to a component. As a tooltip body it also keeps the native
  // status label in step with the rendered text.
  import { ${facts.runtime.helpers.syncTooltipAccessibility} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
${contextImport(facts, [
  `set${d}LegendKey`,
  `set${d}TooltipBody`,
  `set${d}TooltipRow`,
  n.useOptionalInternalRoot,
  "type ChartTooltipBody",
  `type ${n.rowState}`,
])}

  type Props = {
    row?: ${n.rowState};
    legendKey?: string;
    body?: ChartTooltipBody | null;
    tooltip?: Snippet;
    children?: Snippet;
  };
  let { row, legendKey, body, tooltip, children }: Props = $props();

  // The role of a provider is fixed when it is created.
  const role = untrack(() => (row ? "row" : legendKey !== undefined ? "key" : "body"));
  if (role === "row") set${d}TooltipRow({ get state() { return row!; } });
  if (role === "key") set${d}LegendKey({ get key() { return legendKey!; } });
  if (role === "body") set${d}TooltipBody({ get body() { return body ?? null; } });

  const root = ${n.useOptionalInternalRoot}();
  // Sync the status label after the body content renders, and again when it changes.
  $effect(() => {
    if (role !== "body" || !body) return;
    void tooltip;
    void root?.input;
    ${chartTooltipAccessibility(facts, "body")}
  });
`,
    `{#if role === "body"}{#if body}{@render tooltip?.()}{/if}{:else}{@render children?.()}{/if}`,
  );
}

function printRoot(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const h = facts.runtime.helpers;
  const v = facts.visibility;
  const ops = svelteChartOperations(facts);
  return component(
    `
  import {
    ${h.configText},
    ${h.toId},
    ${h.visibleKeys},
    type ChartController,
    type ChartInput,
    type ChartSource,
    type ChartToggleOptions,
    type ChartVisibleChangeDetails,
    type NativeHostOptions,
  } from "${facts.runtime.importSource}";
  import { onMount, untrack } from "svelte";
${contextImport(facts, [
  n.setRoot,
  "type ChartDefinition",
  `type ${n.root}Props`,
  `type ${n.internalState}`,
  `type ${n.state}`,
  `type ${n.entry}`,
  "type ChartValue",
])}

  const EMPTY: readonly never[] = [];
  // Svelte gives the same id on the server and in the browser, so hydration matches.
  const uid = $props.id();
  const generatedId = ${h.toId}(uid);
  let {
    id: idProp,
    chart,
    definition,
    data,
    config,
    params,
    theme,
    host,
    disableTooltip = false,
    ${v.controlledProp} = $bindable(),
    ${v.controlledProp}: commandVisible,
    ${v.defaultProp},
    ${v.callbackProp},
    children,
    ...rest
  }: ${n.root}Props<T, D, X, Y> = $props();

  const id = $derived(idProp ?? generatedId);
  const mode = $derived<"source" | "definition">(definition ? "definition" : "source");
  ${chartDefinitionGuard(ops, facts)}

  ${chartModelHelpers}

  ${chartVisibleModel(ops, facts)}

  ${chartRootInputs(ops, facts)}

  let element = $state<HTMLDivElement | null>(null);
  ${chartVisibleRequests(ops, facts)}

  ${chartTooltipRegistry(ops, n.entry)}

  ${chartRootStateValue(ops, facts, { name: "chartInternal", type: n.internalState }, { name: "chartState", type: n.state })}
  ${n.setRoot}(chartState, chartInternal);
`,
    `<${facts.parts.root.element} {...rest} bind:this={element} data-slot="${slot(facts, "root")}" ${facts.attrs.chartId}={id}>{@render children?.()}</${facts.parts.root.element}>`,
    "T, D = unknown, X extends ChartValue = ChartValue, Y extends ChartValue = ChartValue",
  );
}

function printStyle(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import { ${facts.runtime.helpers.style} } from "${facts.runtime.importSource}";
${contextImport(facts, [n.useRoot])}

${doc(facts, "style", "The Runtime validates the id, config keys and colors before it writes CSS, so the markup holds no consumer markup.")}
  const root = ${n.useRoot}();
  const css = $derived(${facts.runtime.helpers.style}(root.id, root.config));
`,
    `{@html \`<style data-slot="${slot(facts, "style")}">\${css}</style>\`}`,
  );
}

function printSurface(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const ops = svelteChartOperations(facts);
  const h = facts.runtime.helpers;
  return component(
    `
  import {
    ${facts.runtime.factory},
    ${h.prerender},
    ${h.visibleKeys},
    type ChartInput,
  } from "${facts.runtime.importSource}";
  import { getAllContexts, mount, unmount, untrack, type Snippet } from "svelte";
  import ${n.provider} from "./${n.provider}.svelte";
${contextImport(facts, [n.useInternalRoot, "type ChartTooltipBody", `type ${propsName(facts, "surface")}`])}

  let { tooltip, fallbackTooltip, nativeTooltip = false, style, ref, ...rest }: ${propsName(facts, "surface")} = $props();
${printSvelteRefAttachment("HTMLDivElement")}

  ${chartSurfaceHelpers}

  // The chart host. The server render and the first client render show the prerendered SVG.
  // The Runtime controller then adopts it, and Svelte never writes the surface content again.
  // The \`tooltip\` snippet wins over a registered Tooltip. The \`fallbackTooltip\` snippet renders
  // when no Tooltip is registered.
  const root = ${n.useInternalRoot}();
  const contexts = getAllContexts();
  // Computed once, so hydration keeps the server markup and the adopted surface stays untouched.
  const initial = untrack(() => ${chartPrerender(facts)});
  const surfaceStyle = $derived([initial.surfaceStyle, style].filter(Boolean).join(";"));

  type Resolved = { render: Snippet | undefined } | null;
  const resolved = $derived.by<Resolved>(() => {
    ${chartTooltipResolution({
      native: [{ when: "nativeTooltip", value: "null" }],
      explicit: [{ when: "tooltip", value: "{ render: tooltip }" }],
      registered: [
        {
          bind: ["registered", "root.tooltip"],
          when: "registered",
          value: "{ render: registered.content }",
        },
      ],
      fallback: [{ when: "fallbackTooltip", value: "{ render: fallbackTooltip }" }],
    })}
  });
  ${chartTooltipBody(ops)}
  const bodyElement = $derived(portalBody?.element ?? null);

  let element = $state<HTMLDivElement | null>(null);
  let controller: ReturnType<typeof ${facts.runtime.factory}> | null = null;
  let applied: ChartSurfaceSettings | null = null;
  ${chartSurfaceLifecycle(ops, facts)}
  // Svelte has no portal, so the tooltip body content mounts into the body target with this
  // component's contexts. It renders directly inside the target, as React and Vue portals do.
  $effect(() => {
    const target = bodyElement;
    if (!target) return;
    const instance = untrack(() =>
      mount(${n.provider}, {
        target,
        context: new Map(contexts),
        props: {
          get body() {
            return portalBody;
          },
          get tooltip() {
            return resolved?.render;
          },
        },
      }),
    );
    return () => {
      void unmount(instance);
    };
  });
`,
    `<${facts.parts.surface.element}
  {...rest}
  bind:this={element}
  style={surfaceStyle}
  ${facts.parts.surface.discoveryAttribute}=""
  data-slot="${slot(facts, "surface")}"
  {@attach attachRef}
>{@html initial.markup}</${facts.parts.surface.element}>`,
  );
}

function printTooltip(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import { onMount } from "svelte";
${contextImport(facts, [n.useBody, n.useOptionalInternalRoot, `type ${n.entry}`, `type ${propsName(facts, "tooltip")}`])}

${doc(facts, "tooltip")}
  let { children }: ${propsName(facts, "tooltip")} = $props();
  const root = ${n.useOptionalInternalRoot}();
  const body = ${n.useBody}();
  // One stable registration per part, so a parent update keeps its place in the order.
  const entry: ${n.entry} = {
    get content() {
      return children;
    },
  };
  onMount(() => (body || !root ? undefined : root.registerTooltip(entry)));
`,
    `{#if body?.body}{@render children?.()}{/if}`,
  );
}

function printTooltipContent(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const h = facts.runtime.helpers;
  return component(
    `
  import { ${h.tooltipLayout} } from "${facts.runtime.importSource}";
${contextImport(facts, [
  n.setContent,
  n.useBody,
  n.useInternalRoot,
  "type ChartView",
  `type ${n.contentState}`,
  `type ${propsName(facts, "tooltipContent")}`,
])}

${doc(facts, "tooltipContent")}
  let {
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
    children,
    ref,
    ...rest
  }: ${propsName(facts, "tooltipContent")}<T> = $props();
${printSvelteRefAttachment("HTMLDivElement")}

  const body = ${n.useBody}();
  const root = ${n.useInternalRoot}();
  const state = $derived.by<${n.contentState} | null>(() => {
    const target = body?.body;
    if (!target) return null;
    // The Runtime applies the content rules: defined props win over the module preset.
    const layout = ${h.tooltipLayout}<ChartView, T>(
      target,
      root.config,
      typeof root.chart === "object" ? root.chart.presentation : undefined,
      ${chartTooltipLayoutOptions(facts, "svelte")},
    );
    return { ...layout, body: target };
  });
  ${n.setContent}({
    get state() {
      return state;
    },
  });
`,
    `{#if state}
  <${facts.parts.tooltipContent.element}
    {...rest}
    data-slot="${slot(facts, "tooltipContent")}"
    ${facts.attrs.chartId}={root.id}
    data-indicator={state.indicator}
    data-nested={String(state.nested)}
    {@attach attachRef}
  >{@render children?.()}</${facts.parts.tooltipContent.element}>
{/if}`,
    "T = unknown",
  );
}

function printTooltipLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import type { Snippet } from "svelte";
${contextImport(facts, [n.useContent, `type ${propsName(facts, "tooltipLabel")}`])}

${doc(facts, "tooltipLabel")}
  let { ref, ...rest }: ${propsName(facts, "tooltipLabel")} = $props();
${refAttachment(facts, "tooltipLabel", "HTMLDivElement")}
  const content = ${n.useContent}();
`,
    `${VIEW_SNIPPET}

{#if content?.state && !content.state.nested && content.state.showLabel}
  <${facts.parts.tooltipLabel.element} {...rest} data-slot="${slot(facts, "tooltipLabel")}" {@attach attachRef}>{@render view(content.state.heading)}</${facts.parts.tooltipLabel.element}>
{/if}`,
  );
}

function printTooltipItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import ${n.provider} from "./${n.provider}.svelte";
${contextImport(facts, [n.useContent, `type ${propsName(facts, "tooltipItems")}`])}

${doc(facts, "tooltipItems")}
  let { children }: ${propsName(facts, "tooltipItems")} = $props();
  const content = ${n.useContent}();
`,
    `{#if content?.state}
  {#each content.state.view.rows as row, index (row.key)}{#if index > 0}{" "}{/if}<${n.provider}
      row={{ ...content.state.rows[index]!, index, row }}
    >{@render children?.()}</${n.provider}>{/each}
{/if}`,
  );
}

function printTooltipItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import type { Snippet } from "svelte";
${contextImport(facts, [n.useRow, `type ${propsName(facts, "tooltipItem")}`])}

${doc(facts, "tooltipItem")}
  let { customClass, class: className, children, ref, ...rest }: ${propsName(facts, "tooltipItem")} = $props();
${refAttachment(facts, "tooltipItem", "HTMLDivElement")}
  const context = ${n.useRow}();
`,
    `${VIEW_SNIPPET}

{#if context}
  <${facts.parts.tooltipItem.element}
    {...rest}
    class={context.state.row.hasCustom ? (customClass ?? className) : className}
    data-slot="${slot(facts, "tooltipItem")}"
    data-active={String(context.state.active)}
    data-key={context.state.row.item.dataKey}
    aria-hidden="true"
    {@attach attachRef}
  >{#if context.state.row.hasCustom}{@render view(context.state.row.custom)}{:else}{@render children?.()}{/if}</${facts.parts.tooltipItem.element}>
{/if}`,
  );
}

function printTooltipIndicator(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
${contextImport(facts, [n.useRow, `type ${propsName(facts, "tooltipIndicator")}`])}

${doc(facts, "tooltipIndicator")}
  let { ref, ...rest }: ${propsName(facts, "tooltipIndicator")} = $props();
${refAttachment(facts, "tooltipIndicator", "HTMLSpanElement")}
  const context = ${n.useRow}();
  const row = $derived(context?.state.showIndicator ? context.state.row : undefined);
`,
    `{#if row}
  <${facts.parts.tooltipIndicator.element}
    {...rest}
    style:${facts.attrs.indicatorColorVariable}={row.color}
    data-slot="${slot(facts, "tooltipIndicator")}"
    {@attach attachRef}
  ></${facts.parts.tooltipIndicator.element}>
{/if}`,
  );
}

function printTooltipIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import { ${facts.runtime.helpers.isIcon} } from "${facts.runtime.importSource}";
  import type { Component } from "svelte";
${contextImport(facts, [n.useRow, `type ${propsName(facts, "tooltipIcon")}`])}

${doc(facts, "tooltipIcon")}
  let { ref, ...rest }: ${propsName(facts, "tooltipIcon")} = $props();
${refAttachment(facts, "tooltipIcon", "HTMLSpanElement")}
  const context = ${n.useRow}();
  const row = $derived(context?.state.row);
`,
    `${iconSnippet(facts)}

{#if row?.icon}
  <${facts.parts.tooltipIcon.element}
    {...rest}
    style:color={row.color}
    data-slot="${slot(facts, "tooltipIcon")}"
    aria-hidden="true"
    {@attach attachRef}
  >{@render icon(row.icon)}</${facts.parts.tooltipIcon.element}>
{/if}`,
  );
}

function printTooltipName(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import type { Snippet } from "svelte";
${contextImport(facts, [n.useContent, n.useRow, `type ${propsName(facts, "tooltipName")}`])}

${doc(facts, "tooltipName")}
  let { labelClass, ref, ...rest }: ${propsName(facts, "tooltipName")} = $props();
${refAttachment(facts, "tooltipName", "HTMLSpanElement")}
  const content = ${n.useContent}();
  const context = ${n.useRow}();
  const row = $derived(context?.state.row);
  const nested = $derived(!!context?.state.nestHeading);
`,
    `${VIEW_SNIPPET}

{#if content?.state && row}
  <${facts.parts.tooltipName.element} {...rest} data-slot="${slot(facts, "tooltipName")}" {@attach attachRef}
    >{#if nested}<span class={labelClass} data-slot="${slot(facts, "tooltipLabel")}">{@render view(content.state.heading)}</span>{" "}{/if}{@render view(row.name)}</${facts.parts.tooltipName.element}
  >
{/if}`,
  );
}

function printTooltipValue(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import type { Snippet } from "svelte";
${contextImport(facts, [n.useRow, `type ${propsName(facts, "tooltipValue")}`])}

${doc(facts, "tooltipValue")}
  let { ref, ...rest }: ${propsName(facts, "tooltipValue")} = $props();
${refAttachment(facts, "tooltipValue", "HTMLSpanElement")}
  const context = ${n.useRow}();
`,
    `${VIEW_SNIPPET}

{#if context}
  <${facts.parts.tooltipValue.element} {...rest} data-slot="${slot(facts, "tooltipValue")}" {@attach attachRef}>{@render view(context.state.row.value)}</${facts.parts.tooltipValue.element}>
{/if}`,
  );
}

function printLegend(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
${contextImport(facts, [n.setLegend, `type ${propsName(facts, "legend")}`])}

${doc(facts, "legend", "A consumer aria-label replaces the default.")}
  let { hideIcon = false, children, ref, ...rest }: ${propsName(facts, "legend")} = $props();
${refAttachment(facts, "legend", "HTMLDivElement")}
  ${n.setLegend}({
    get hideIcon() {
      return hideIcon;
    },
  });
`,
    `<${facts.parts.legend.element}
  role="group"
  aria-label="${facts.defaults.legendAriaLabel}"
  {...rest}
  data-slot="${slot(facts, "legend")}"
  {@attach attachRef}
>{@render children?.()}</${facts.parts.legend.element}>`,
  );
}

function printLegendItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import ${n.provider} from "./${n.provider}.svelte";
${contextImport(facts, [n.useRoot, `type ${propsName(facts, "legendItems")}`])}

${doc(facts, "legendItems")}
  let { children }: ${propsName(facts, "legendItems")} = $props();
  const root = ${n.useRoot}();
`,
    `{#each root.keys as key (key)}<${n.provider} legendKey={key}>{@render children?.()}</${n.provider}>{/each}`,
  );
}

function printLegendItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import { ${facts.runtime.helpers.configText} } from "${facts.runtime.importSource}";
  import ${n.provider} from "./${n.provider}.svelte";
${contextImport(facts, [n.useKey, n.useRoot, `type ${propsName(facts, "legendItem")}`])}

${doc(facts, "legendItem")}
  let {
    value,
    interactive,
    onclick,
    children,
    ref,
    "aria-label": ariaLabelProp,
    ...rest
  }: ${propsName(facts, "legendItem")} = $props();
  import { createRefAttachment as createAttachRef } from "../_internal/ref-attachment.js";
  const attachRef = createAttachRef<HTMLElement>(() => ref);
  const root = ${n.useRoot}();
  const contextKey = ${n.useKey}();
  const key = $derived.by(() => {
    const next = value ?? contextKey?.key;
    if (next == null)
      throw new Error("${facts.displayName}.LegendItem needs a value or a ${facts.displayName}.LegendItems parent.");
    return next;
  });
  const ariaLabel = $derived.by(() => {
    if (ariaLabelProp != null) return ariaLabelProp;
    const entry = root.config[key];
    const rich = entry?.label;
    const plain = rich == null || typeof rich === "string" || typeof rich === "number";
    return plain ? undefined : ${facts.runtime.helpers.configText}(entry, key);
  });
  const on = $derived(root.visible.includes(key));
  const active = $derived(interactive ?? root.mode === "source");
  const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
    ${chartLegendToggle("onclick?.(event);", "event", "event.currentTarget")}
  };
`,
    `{#if active}
  <${facts.parts.legendItem.element}
    {...rest}
    type="button"
    aria-label={ariaLabel}
    aria-pressed={on}
    data-state={on ? "on" : "off"}
    data-key={key}
    data-slot="${slot(facts, "legendItem")}"
    onclick={handleClick}
    {@attach attachRef}
  ><${n.provider} legendKey={key}>{@render children?.()}</${n.provider}></${facts.parts.legendItem.element}>
{:else}
  <!-- A passive item keeps only presentational attributes. -->
  <span
    id={rest.id}
    class={rest.class}
    style={rest.style}
    title={rest.title}
    aria-label={ariaLabel}
    data-key={key}
    data-slot="${slot(facts, "legendItem")}"
    {@attach attachRef}
  ><${n.provider} legendKey={key}>{@render children?.()}</${n.provider}></span>
{/if}`,
  );
}

function printLegendSwatch(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
${contextImport(facts, [n.useKey, n.useLegend, n.useRoot, `type ${propsName(facts, "legendSwatch")}`])}

${doc(facts, "legendSwatch")}
  let { ref, ...rest }: ${propsName(facts, "legendSwatch")} = $props();
${refAttachment(facts, "legendSwatch", "HTMLSpanElement")}
  const root = ${n.useRoot}();
  const context = ${n.useKey}();
  const legend = ${n.useLegend}();
  const key = $derived(context?.key);
`,
    `{#if key != null && !(root.config[key]?.icon && !legend.hideIcon)}
  <${facts.parts.legendSwatch.element}
    {...rest}
    style:background={\`var(${facts.attrs.seriesColorVariablePrefix}\${key})\`}
    data-slot="${slot(facts, "legendSwatch")}"
    aria-hidden="true"
    {@attach attachRef}
  ></${facts.parts.legendSwatch.element}>
{/if}`,
  );
}

function printLegendIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import { ${facts.runtime.helpers.isIcon} } from "${facts.runtime.importSource}";
  import type { Component } from "svelte";
${contextImport(facts, [n.useKey, n.useLegend, n.useRoot, `type ${propsName(facts, "legendIcon")}`])}

${doc(facts, "legendIcon")}
  let { ref, ...rest }: ${propsName(facts, "legendIcon")} = $props();
${refAttachment(facts, "legendIcon", "HTMLSpanElement")}
  const root = ${n.useRoot}();
  const context = ${n.useKey}();
  const legend = ${n.useLegend}();
  const key = $derived(context?.key);
  const value = $derived(key == null ? undefined : root.config[key]?.icon);
`,
    `${iconSnippet(facts)}

{#if key != null && value && !legend.hideIcon}
  <${facts.parts.legendIcon.element}
    {...rest}
    style:color={\`var(${facts.attrs.seriesColorVariablePrefix}\${key})\`}
    data-slot="${slot(facts, "legendIcon")}"
    aria-hidden="true"
    {@attach attachRef}
  >{@render icon(value)}</${facts.parts.legendIcon.element}>
{/if}`,
  );
}

function printLegendLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return component(
    `
  import type { Snippet } from "svelte";
${contextImport(facts, [n.useKey, n.useRoot, `type ${propsName(facts, "legendLabel")}`])}

${doc(facts, "legendLabel")}
  let { ref, ...rest }: ${propsName(facts, "legendLabel")} = $props();
${refAttachment(facts, "legendLabel", "HTMLSpanElement")}
  const root = ${n.useRoot}();
  const context = ${n.useKey}();
  const key = $derived(context?.key);
  const rich = $derived(key == null ? undefined : root.config[key]?.label);
  const plain = $derived(rich == null || typeof rich === "string" || typeof rich === "number");
`,
    `${VIEW_SNIPPET}

{#if key != null}
  <${facts.parts.legendLabel.element} {...rest} data-slot="${slot(facts, "legendLabel")}" {@attach attachRef}>{#if plain}{root.label(key)}{:else}{@render view(rich)}{/if}</${facts.parts.legendLabel.element}>
{/if}`,
  );
}

export function printSvelteChartSurfaceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const { facts } = file.family as unknown as ChartSurfaceIndexProjection;
  const n = names(facts);
  const parts = Object.values(facts.parts);
  const imports = parts
    .map((part) => `import ${part.exportName} from "./${part.exportName}.svelte";`)
    .join("\n");
  const members = parts.map((part) => `  ${part.namespaceKey}: ${part.exportName},`).join("\n");
  const memberTypes = parts
    .map((part) => `  ${part.namespaceKey}: typeof ${part.exportName};`)
    .join("\n");
  const named = parts.map((part) => `  ${part.exportName},`).join("\n");
  const types = chartPublicTypes(facts);
  // Svelte context holds getter objects, so the tooltip body state that useChartTooltipBody()
  // returns is a Svelte type. The legend key state has no public accessor, so it stays internal.
  const publicTypes = [...types.all, ...types.context, ...types.rootUnion, n.bodyState];

  return {
    contents: `
${imports}

// The type names each part, so declaration output can name the generic parts.
const ${facts.exports.namespace}: {
${memberTypes}
} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${facts.exports.namespace} as ${facts.exports.namespaceAlias},
${named}
};

export default ${facts.exports.namespace};

export { ${n.useBody}, ${n.useRoot} } from "./${n.context}.js";
export type {
${publicTypes.map((name) => `  ${name},`).join("\n")}
} from "./${n.context}.js";

export type {
${facts.exports.helperTypes.map((name) => `  ${name},`).join("\n")}
} from "${facts.exports.runtimeImportSource}";
export { ${facts.exports.helperValues.join(", ")} } from "${facts.exports.runtimeImportSource}";
`,
    path: file.path,
  };
}
