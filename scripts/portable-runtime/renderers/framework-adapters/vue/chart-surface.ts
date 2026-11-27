import { CHART_MARK_KINDS } from "../../../../../packages/runtime/src/components/chart/part-defaults.js";
import {
  chartDefinitionGuard,
  chartLegendToggle,
  chartModelHelpers,
  chartPrerender,
  chartRootInputs,
  chartRootState,
  chartRootStateValue,
  chartSpecRegistry,
  chartSpecSurfaceStyle,
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
  type ChartSpecPartName,
  type ChartSurfaceComponentProjection,
  type ChartSurfaceFacts,
  type ChartSurfaceIndexProjection,
  type ChartSurfacePartName,
  type ChartSurfacePropFacts,
  type ChartTypeWords,
  chartComment,
  chartLegendKeyMessage,
  chartNames,
  chartOutsideRootMessage,
  chartPartProps,
  chartProp,
  chartPropDefault,
  chartPropType,
  chartPublicTypes,
  chartSlot,
  chartSpecOptions,
  chartSpecPartDoc,
  chartSpecPartFiles,
  chartSpecPartProps,
  printChartSpecOptionFields,
  printChartSpecPartReader,
  printChartSpecPartTypes,
} from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import type {
  AdapterComponentFile,
  AdapterFamilyHelperProjection,
  AdapterHelperFile,
  AdapterOutputModel,
} from "../types.js";
import { vueChartOperations } from "./recipe-chart-operations.js";

/**
 * Vue target home for the chart Specialized Adapter Spec. Every part is a single-file component
 * with a render function, so the parts can merge attributes in a fixed order, render framework
 * view values (VNodes, render functions and components) and put spaces between tooltip parts.
 * Shared types, injection keys and view helpers live in one context module.
 */
export type VueChartSurfaceComponentProjection = ChartSurfaceComponentProjection;
export type VueChartSurfaceIndexProjection = ChartSurfaceIndexProjection;
export type VueChartContextProjection = { facts: ChartSurfaceFacts; kind: "vue-chart-context" };

/** A chart spec part. It registers its props with the Root and renders nothing. */
type VueChartSpecPartProjection = {
  facts: ChartSurfaceFacts;
  kind: "vue-chart-spec-part";
  part: ChartSpecPartName;
};

export function isVueChartSurfaceProjection(family: unknown): boolean {
  const kind = (family as { kind?: string } | undefined)?.kind;
  return kind === "chart-surface" || kind === "vue-chart-spec-part";
}

export function isVueChartContextProjection(family: unknown): family is VueChartContextProjection {
  return (family as { kind?: string } | undefined)?.kind === "vue-chart-context";
}

/** Adds the shared chart context module before the chart index. */
export function projectVueChartSurfaceOutputModel(model: AdapterOutputModel): AdapterOutputModel {
  const index = model.files.find(
    (file) =>
      file.kind === "index" &&
      (file.family as { kind?: string } | undefined)?.kind === "chart-surface",
  );
  if (!index || index.kind !== "index") return model;
  const facts = (index.family as unknown as ChartSurfaceIndexProjection).facts;
  const directory = index.path.slice(0, index.path.lastIndexOf("/"));
  const context: AdapterHelperFile = {
    body: { code: "" } as AdapterHelperFile["body"],
    family: { facts, kind: "vue-chart-context" } as unknown as AdapterFamilyHelperProjection,
    imports: [],
    kind: "helper",
    name: names(facts).context,
    path: `${directory}/${names(facts).context}.ts`,
    target: "vue",
  };
  const template = model.files.find(
    (file): file is AdapterComponentFile =>
      file.kind === "component" &&
      (file.component.family as { kind?: string } | undefined)?.kind === "chart-surface",
  );
  if (!template) throw new Error("The Vue chart output needs a chart part file.");
  const specParts = chartSpecPartFiles(facts, template, directory, "vue-chart-spec-part");
  const files = [...model.files];
  files.splice(files.indexOf(index), 0, ...specParts, context);
  return { files };
}

export function printVueChartSurfaceComponent(
  projection: VueChartSurfaceComponentProjection | VueChartSpecPartProjection,
): string {
  if (projection.kind === "vue-chart-spec-part")
    return printSpecPart(projection.facts, projection.part);
  const { facts, part } = projection;
  const code = printPart(facts, part);
  // The Root and Surface expose their elements themselves. Other parts that forward a ref expose
  // the element they render, as ADR 0011 asks of a public component ref.
  return facts.parts[part].forwardsRef && part !== "surface"
    ? withElementRef(code, facts, part)
    : code;
}

function withElementRef(
  code: string,
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
): string {
  const setup = /setup\((_|props), \{ attrs(, slots)? \}\) \{\n/;
  const dataSlot = `"data-slot": "${slot(facts, part)}"`;
  if (!setup.test(code) || !code.includes(dataSlot) || !code.includes(' } from "vue";')) {
    throw new Error(`Vue chart part "${part}" cannot expose its element.`);
  }
  return code
    .replace(/ \} from "vue";/, ', ref } from "vue";')
    .replace(
      setup,
      (_match, first: string, slots: string | undefined) =>
        `setup(${first}, { attrs, expose${slots ?? ""} }) {\n    const element = ref<HTMLElement | null>(null);\n    expose({ element });\n`,
    )
    .split(dataSlot)
    .join(`ref: element, ${dataSlot}`);
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

function names(facts: ChartSurfaceFacts) {
  const d = facts.displayName;
  const root = facts.parts.root.exportName;
  return {
    ...chartNames(facts),
    bodyKey: `${d}TooltipBodyKey`,
    contentKey: `${d}TooltipContentKey`,
    icon: `render${d}Icon`,
    keyKey: `${d}LegendKeyKey`,
    legendKey: `${d}LegendKey`,
    internalKey: `${root}InternalKey`,
    rootKey: `${root}Key`,
    rowKey: `${d}TooltipRowKey`,
    view: `render${d}View`,
  };
}

const slot = chartSlot;

/** Vue renders body content as a view too, so both placeholders name the Vue view type. */
const WORDS: ChartTypeWords = {
  ChartClass: "unknown",
  ChartContent: "ChartView",
  ChartView: "ChartView",
};

/** Vue part props. Children arrive as slots, so they are not props. */
function vueProps(facts: ChartSurfaceFacts, part: ChartSurfacePartName): ChartSurfacePropFacts[] {
  return chartPartProps(facts, part, "vue").filter((prop) => prop.kind !== "children");
}

/** A formatter returns a render result, so its view is \`VNodeChild\` as Vue render functions give. */
function words(prop: ChartSurfacePropFacts, extra: Partial<ChartTypeWords> = {}): ChartTypeWords {
  return { ...WORDS, ...(prop.kind === "callback" ? { ChartView: "VNodeChild" } : {}), ...extra };
}

function propType(facts: ChartSurfaceFacts, part: ChartSurfacePartName, name: string): string {
  const prop = chartProp(facts, part, name);
  return chartPropType(prop, words(prop));
}

/** The runtime prop option that matches a contract type. Single-file components cannot name \`T\`. */
function runtimeProp(prop: ChartSurfacePropFacts): string {
  const type = chartPropType(prop, words(prop, { T: "any" }));
  const option =
    prop.type === "boolean"
      ? "Boolean"
      : prop.type === "string"
        ? "String"
        : prop.type.startsWith('"')
          ? `String as PropType<${type}>`
          : prop.type.startsWith("((") && prop.type.endsWith("| ChartFormat")
            ? `[Function, Object] as PropType<${type}>`
            : prop.type.startsWith("(")
              ? `Function as PropType<${type}>`
              : prop.type === "ChartClass"
                ? "null"
                : `null as unknown as PropType<${type}>`;
  return `${prop.name}: { type: ${option}, default: ${prop.defaultValue ?? "undefined"} },`;
}

/** The runtime prop options of a part, each with its doc comment. */
function runtimeProps(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  const props = vueProps(facts, part);
  const firstOpenBoolean = props.find(
    (prop) => prop.type === "boolean" && prop.defaultValue === undefined,
  );
  return props
    .map((prop) =>
      [
        prop.description ? chartComment(prop.description, "block", "    ") : "",
        prop === firstOpenBoolean
          ? "    // An explicit undefined default keeps an absent boolean from turning into false."
          : "",
        `    ${runtimeProp(prop)}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
}

function doc(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return chartComment(facts.parts[part].doc!, "block");
}

function displayName(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return `${facts.displayName}.${facts.parts[part].namespaceKey}`;
}

function contextImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `import { ${members.join(", ")} } from "./${names(facts).context}.js";`;
}

function sfc(body: string): string {
  return `<script lang="ts">\n${body.trim()}\n</script>\n`;
}

export function printVueChartContext(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const h = facts.runtime.helpers;
  const v = facts.visibility;
  const d = facts.displayName;
  return `import {
  type ChartConfig as RuntimeChartConfig,
  type ChartController,
  type ChartInput,
  type ChartModule,
  type ChartPart,
  type ChartSource,
  type ChartSpec,
  type ChartSpecOptions,
  type ChartTickFormatter,
  type ChartToggleOptions,
  type ChartVisibleChangeDetails,
  type CreateChartOptions,
  type NativeHostOptions,
  type TooltipItem,
  type TooltipLayoutRow,
  type TooltipView,
  type TooltipViewRow,
  ${h.isIcon},
} from "${facts.runtime.importSource}";
import {
  type Component,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type VNode,
  type VNodeChild,
  Comment,
  Fragment,
  camelize,
  defineComponent,
  h,
  inject,
  isVNode,
  onBeforeUnmount,
  provide,
  toRef,
  watch,
} from "vue";

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

/** A Vue view value: text, a VNode, a render function or a component. */
export type ChartView = VNodeChild | Component | (() => VNodeChild);

/**
 * Vue chart config. Rich labels are VNodes, render functions or components and need \`text\`.
 * Icons are components or portable icons.
 */
export type ChartConfig = RuntimeChartConfig<ChartView, Component>;

type ${n.root}CommonProps<D, X extends ChartValue, Y extends ChartValue> = {
  /**
   * Unique chart id. It scopes config colors and prefixes native ids. Generated with \`useId()\`
   * when omitted. Vue numbers generated ids per app, so give explicit ids to charts in separate
   * Astro \`client:only\` islands.
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
${printChartSpecOptionFields(facts, "root")}
  /** A parts chart takes its accessible name from it. Other charts keep it on the root element. */
  "aria-label"?: string;
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
   * Visible keys for \`v-model:${v.controlledProp}\`. A defined value at setup makes the keys
   * parent-controlled for the Root's lifetime. Otherwise the Runtime owns them, and a later
   * defined value is a silent command. An empty array hides every series.
   */
  ${v.controlledProp}?: readonly string[];
  /** Initial visible keys when \`v-model:${v.controlledProp}\` is unbound. Omit it to show every config key. */
  ${v.defaultProp}?: readonly string[];
  "onUpdate:${v.controlledProp}"?: (visible: string[]) => void;
  /**
   * Receives each visibility proposal before the cancelable \`${v.domEvent}\` event. Call
   * \`details.cancel()\` to keep the current keys.
   */
  ${v.callbackProp}?: (visible: string[], details: ChartVisibleChangeDetails) => void;
};

/**
 * A static native definition. It owns its visibility, so the legend is passive. Templates reject
 * \`v-model:${v.controlledProp}\` and \`:${v.defaultProp}\` here. A template type check does not
 * always reject a visibility listener on a definition, so the Root throws at setup when it
 * receives one.
 */
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
  "onUpdate:${v.controlledProp}"?: never;
  ${v.callbackProp}?: never;
};

/**
 * Chart parts in the default slot, such as a bar and an x axis, describe the chart. It follows the
 * visibility model, and \`aria-label\` names the chart.
 */
export type ${n.root}SpecProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = Omit<${n.root}SourceProps<T, D, X, Y>, "chart"> & {
  chart?: never;
};

/**
 * Props of ${d}.Root. Use chart parts in the default slot, \`chart\` (a chart module or factory) or
 * \`definition\` (a static native definition). A definition owns its visibility, so it rejects
 * \`v-model:${v.controlledProp}\`, \`${v.defaultProp}\` and \`${v.callbackProp}\`.
 */
export type ${n.root}Props<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> =
  | ${n.root}SourceProps<T, D, X, Y>
  | ${n.root}DefinitionProps<T, D, X, Y>
  | ${n.root}SpecProps<T, D, X, Y>;

${printChartSpecPartTypes(facts, "vue")}

/** One Tooltip registration. The surface renders the first one. */
export interface ${n.entry} {
  render(): VNodeChild;
}

/** Read-only reactive chart state. Each getter reads Vue state, so render functions track it. */
${chartRootState(n.state, n.internalState, n.entry, true)}

export interface ${d}TooltipContentState {
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

export interface ${d}TooltipRowState extends TooltipLayoutRow {
  index: number;
  row: TooltipViewRow<ChartView>;
}

export interface ${d}LegendState {
  hideIcon: boolean;
}

export const ${n.rootKey}: InjectionKey<${n.state}> = Symbol("starwind-chart-root");
export const ${n.internalKey}: InjectionKey<${n.internalState}> = Symbol("starwind-chart-root-internal");
export const ${n.bodyKey}: InjectionKey<ComputedRef<ChartTooltipBody | null>> = Symbol(
  "starwind-chart-tooltip-body",
);
export const ${n.contentKey}: InjectionKey<ComputedRef<${d}TooltipContentState | null>> = Symbol(
  "starwind-chart-tooltip-content",
);
export const ${n.rowKey}: InjectionKey<ComputedRef<${d}TooltipRowState>> = Symbol(
  "starwind-chart-tooltip-row",
);
export const ${n.legendKey}: InjectionKey<ComputedRef<${d}LegendState>> = Symbol(
  "starwind-chart-legend",
);
export const ${n.keyKey}: InjectionKey<ComputedRef<string>> = Symbol("starwind-chart-legend-key");

/** The public chart state: config keys, visible keys and visibility requests. */
export function ${n.useRoot}(): ${n.state} {
  const state = inject(${n.rootKey}, null);
  if (!state) throw new Error(${JSON.stringify(chartOutsideRootMessage(facts))});
  return state;
}

export function ${n.useOptionalInternalRoot}(): ${n.internalState} | null {
  return inject(${n.internalKey}, null);
}

export function ${n.useInternalRoot}(): ${n.internalState} {
  const state = inject(${n.internalKey}, null);
  if (!state) throw new Error(${JSON.stringify(chartOutsideRootMessage(facts))});
  return state;
}

/** The tooltip body that the current content renders for. The value is \`null\` outside a body. */
export function ${n.useBody}(): ComputedRef<ChartTooltipBody | null> | null {
  return inject(${n.bodyKey}, null);
}

export function ${n.useContent}(): ComputedRef<${d}TooltipContentState | null> | null {
  return inject(${n.contentKey}, null);
}

export function ${n.useRow}(): ComputedRef<${d}TooltipRowState> | null {
  return inject(${n.rowKey}, null);
}

export function ${n.useLegend}(): ${d}LegendState {
  return inject(${n.legendKey}, null)?.value ?? { hideIcon: ${chartPropDefault(facts, "legend", "hideIcon")} };
}

export function ${n.useKey}(): ComputedRef<string> | null {
  return inject(${n.keyKey}, null);
}

${printChartSpecPartReader(facts, "vue")}

/** The mark part kinds, from the Runtime list. */
const LEGEND_MARKS = new Set<string>(${JSON.stringify(CHART_MARK_KINDS)});

/**
 * The mark parts among a Root's slot vnodes, in source order, through arrays and fragments, or
 * \`undefined\` when there is none. A legend before a mark part renders before the part registers,
 * so the first legend lists their keys. It keeps only the props that the legend reads. A part inside
 * another component is not found.
 */
export function collectChartLegendSeed(nodes: unknown): ChartSpec | undefined {
  const parts: ChartPart[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (!isVNode(node)) return;
    else if (node.type === Fragment) walk(node.children);
    else {
      const kind = (node.type as { chartSpecPart?: ChartPart["kind"] } | null)?.chartSpecPart;
      if (!kind || !LEGEND_MARKS.has(kind)) return;
      const part: Record<string, unknown> = { kind };
      // A template can write a prop name in kebab case.
      for (const [key, value] of Object.entries(node.props ?? {})) {
        const name = camelize(key);
        if (name === "dataKey" || name === "nameKey") part[name] = value;
      }
      parts.push(part as unknown as ChartPart);
    }
  };
  walk(nodes);
  return parts.length ? { parts } : undefined;
}

/**
 * The spec whose keys a legend lists before the Root mounts: the parts that registered so far and
 * the mark parts of the slot seed together. A part inside another component is not in the seed, but
 * it registers before a later legend renders, on the server and in hydration alike. The legend
 * lists keys in config order, so the order of the parts does not matter.
 */
export function mergeChartLegendSeed(
  seed: ChartSpec | undefined,
  live: ChartSpec | undefined,
): ChartSpec | undefined {
  if (!seed) return live;
  if (!live) return seed;
  return { ...live, parts: [...live.parts, ...seed.parts] };
}

/**
 * Registers one chart spec part with the Root, in source order, and removes it on unmount. It
 * registers in setup, so a server render knows the part before the Surface draws. A prop change
 * updates the part in place. A function prop becomes a stable delegate that calls the current
 * prop. A function with a new identity draws the chart again, so a formatter that reads new state
 * shows its new text.
 */
export function use${d}SpecPart(kind: ChartPart["kind"], props: Record<string, unknown>): void {
  const root = ${n.useOptionalInternalRoot}();
  if (!root) return;
  assertChartSpecPartRoot(root.partsMode);
  const delegates = new Map<string, (...args: any[]) => unknown>();
  const delegate = (name: string) => {
    let call = delegates.get(name);
    if (!call) {
      call = (...args: any[]) => (readChartSpecProp(props, name) as (...args: any[]) => unknown)(...args);
      delegates.set(name, call);
    }
    return call;
  };
  const read = () => readChartSpecPart(kind, props, delegate);
  const registration = root.registerSpecPart(read(), readChartSpecFunctions(kind, props));
  watch(read, (part) => registration.update(part, readChartSpecFunctions(kind, props)));
  onBeforeUnmount(() => registration.remove());
}

/**
 * Registers the chart-level options of a part, such as the Tooltip \`cursor\`, with a parts chart
 * Root. It registers in setup, as a spec part does, so the chart starts with them. A prop change
 * updates the options in place.
 */
export function use${d}SpecOptions(read: () => ChartSpecOptions): void {
  const root = ${n.useOptionalInternalRoot}();
  // A chart module ignores the options, and a later switch to parts keeps them.
  if (!root) return;
  const registration = root.registerSpecOptions(read());
  watch(read, (options) => registration.update(options));
  onBeforeUnmount(() => registration.remove());
}

/** Renders a config label, heading or formatter result: text, a VNode, a render function or a component. */
export function ${n.view}(value: unknown): VNodeChild {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  // A render function is a valid functional component, so both forms use h().
  return h(value as Component);
}

/** Portable icon data or a Vue icon component. No markup strings are parsed. */
export function ${n.icon}(icon: unknown): VNodeChild {
  if (${h.isIcon}(icon)) {
    return h(
      "svg",
      {
        viewBox: icon.viewBox ?? "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        width: "1em",
        height: "1em",
        "aria-hidden": "true",
        focusable: "false",
      },
      icon.paths.map((d) => h("path", { d })),
    );
  }
  return h(icon as Component);
}

function flatten(nodes: readonly VNodeChild[]): VNodeChild[] {
  return nodes.flatMap((node) => {
    if (Array.isArray(node)) return flatten(node);
    if (isVNode(node) && node.type === Fragment && Array.isArray(node.children))
      return flatten(node.children as VNodeChild[]);
    if (node == null || typeof node === "boolean") return [];
    if (isVNode(node) && node.type === Comment) return [];
    return [node];
  });
}

/**
 * Puts a space between tooltip parts. Grid and flex layouts do not render it, and the Runtime
 * reads it when it builds the accessible label from the visible text.
 */
export function ${n.spaced}(children: VNodeChild[] | undefined): VNodeChild[] {
  return flatten(children ?? []).flatMap((child, index) => (index === 0 ? [child] : [" ", child]));
}

/** Internal part. Provides one tooltip row or one legend key to the slot content. */
export const ${n.provider} = defineComponent({
  name: "${n.provider}",
  props: {
    row: { type: Object as PropType<${d}TooltipRowState>, default: undefined },
    legendKey: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    if (props.row) provide(${n.rowKey}, toRef(() => props.row!) as unknown as ComputedRef<${d}TooltipRowState>);
    if (props.legendKey !== undefined)
      provide(${n.keyKey}, toRef(() => props.legendKey!) as unknown as ComputedRef<string>);
    return () => slots.default?.() as VNode[] | undefined;
  },
});

export type { TooltipItem };
`;
}

function printRoot(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const h = facts.runtime.helpers;
  const v = facts.visibility;
  const model = v.controlledProp;
  const ops = vueChartOperations(facts);
  return sfc(`
import {
  type ChartController,
  type ChartInput,
  type ChartPart,
  type ChartSource,
  type ChartSpec,
  type ChartSpecOptions,
  type ChartToggleOptions,
  type ChartVisibleChangeDetails,
  type NativeHostOptions,
  buildChartSpec,
  ${h.legendKeys},
  ${h.configText},
  isSameChartSpec,
  ${h.toId},
  ${h.visibleKeys},
} from "${facts.runtime.importSource}";
import {
  type PropType,
  camelize,
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  mergeProps,
  onMounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  useId,
  watch,
} from "vue";
${contextImport(facts, [
  "type ChartConfig",
  "type ChartDefinition",
  "type ChartSpecEntry",
  "collectChartLegendSeed",
  "mergeChartLegendSeed",
  `type ${n.entry}`,
  `type ${n.internalState}`,
  `type ${n.state}`,
  n.internalKey,
  n.rootKey,
])}

const EMPTY: readonly never[] = [];

${chartModelHelpers}

// A template compiles a visibility listener to several vnode keys: \`@visible-change\` and
// \`:onVisibleChange\` give "${v.callbackProp}", \`:on-visible-change\` gives "on-visible-change",
// \`@update:${model}\` gives "onUpdate:${model}", and \`.once\` adds "Once". A key that Vue does not
// match to an emit falls through as an attribute and never runs, so the guard reads every form.
const VISIBILITY_LISTENERS = new Set(["${v.callbackProp}", "onUpdate:${model}"]);
function hasVisibilityListener(props: Record<string, unknown> | null | undefined): boolean {
  if (!props) return false;
  return Object.keys(props).some(
    (key) => props[key] != null && VISIBILITY_LISTENERS.has(camelize(key).replace(/Once$/, "")),
  );
}

/**
 * The chart root. It owns the chart input, the visibility model props and the tooltip
 * registrations. The Runtime controller owns the accepted visible keys.
 */
export default defineComponent({
  name: "${displayName(facts, "root")}",
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    chart: {
      type: [Object, Function] as PropType<ChartSource<any, any, any, any>>,
      default: undefined,
    },
    definition: { type: Object as PropType<ChartDefinition<any, any, any>>, default: undefined },
    data: { type: Array as PropType<readonly unknown[]>, default: undefined },
    config: { type: Object as PropType<ChartConfig>, required: true },
    params: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    theme: { type: Object as PropType<ChartInput["theme"]>, default: undefined },
    host: { type: Object as PropType<NativeHostOptions<any, any, any>>, default: undefined },
    disableTooltip: { type: Boolean, default: false },
${vueOptionProps(facts, "root", "    ")}
    /** A parts chart takes its accessible name from it. Other charts keep it on the root element. */
    ariaLabel: { type: String, default: undefined },
    ${v.controlledProp}: { type: Array as PropType<readonly string[]>, default: undefined },
    ${v.defaultProp}: { type: Array as PropType<readonly string[]>, default: undefined },
  },
  emits: {
    "update:${model}": (_visible: string[]) => true,
    ${v.callbackProp[2]!.toLowerCase()}${v.callbackProp.slice(3)}: (_visible: string[], _details: ChartVisibleChangeDetails) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
    const generatedId = ${h.toId}(useId() ?? "");
    const id = computed(() => props.id ?? generatedId);
    const mode = computed<"source" | "definition">(() =>
      props.definition ? "definition" : "source",
    );
    ${chartDefinitionGuard(ops, facts)}

    ${chartVisibleModel(ops, facts)}
    // The engine reads raw values, not deep proxies.
    const config = computed(() => toRaw(props.config) as ChartConfig);
    ${chartSpecRegistry(ops, facts)}
    ${chartRootInputs(ops, facts)}

    const element = ref<HTMLDivElement | null>(null);
    ${chartVisibleRequests(ops, facts)}

      ${chartTooltipRegistry(ops, n.entry)}

    // The mark parts among the slot vnodes, read in each render before the Root mounts. A legend
    // before a mark part renders before that part registers, so it lists their keys. The legend
    // also reads the parts that registered so far, such as a part inside another component.
    let legendSeed: ChartSpec | undefined;
    const legendMounted = ref(false);
    onMounted(() => {
      legendMounted.value = true;
    });
    ${chartRootStateValue(ops, facts, { name: "internal", type: n.internalState }, { name: "state", type: n.state })}
    provide(${n.internalKey}, internal);
    provide(${n.rootKey}, state);
    expose({ element });

    return () => {
      const children = slots.default?.();
      if (!instance?.isMounted) legendSeed = partsMode.value ? collectChartLegendSeed(children) : undefined;
      return h(
        "${facts.parts.root.element}",
        mergeProps(attrs, {
          ref: element,
          "aria-label": partsMode.value ? undefined : props.ariaLabel,
          "data-slot": "${slot(facts, "root")}",
          "${facts.attrs.chartId}": id.value,
        }),
        children,
      );
    };
  },
});
`);
}

function printStyle(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { ${facts.runtime.helpers.style} } from "${facts.runtime.importSource}";
import { computed, defineComponent, h } from "vue";
${contextImport(facts, [n.useRoot])}

${doc(facts, "style")}
export default defineComponent({
  name: "${displayName(facts, "style")}",
  setup() {
    const root = ${n.useRoot}();
    // The Runtime validates the id, config keys and colors before it writes CSS.
    const css = computed(() => ${facts.runtime.helpers.style}(root.id, root.config));
    return () => h("style", { "data-slot": "${slot(facts, "style")}", innerHTML: css.value });
  },
});
`);
}

function printSurface(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const ops = vueChartOperations(facts);
  const h = facts.runtime.helpers;
  return sfc(`
import {
  chartSurfaceStyle,
  createChartOptions,
  ${facts.runtime.factory},
  ${facts.runtime.getController},
  ${h.prerender},
  ${h.syncTooltipAccessibility},
  ${h.visibleKeys},
  isChartSpecComplete,
  warnEmptyChart,
  warnIncompleteChart,
} from "${facts.runtime.importSource}";
import {
  type PropType,
  Teleport,
  computed,
  defineComponent,
  h,
  mergeProps,
  onActivated,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onServerPrefetch,
  onUpdated,
  provide,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { ChartInput } from "${facts.runtime.importSource}";
${contextImport(facts, ["type ChartTooltipBody", "type ChartView", n.bodyKey, n.useInternalRoot, n.view])}

${chartSurfaceHelpers}

/**
 * The chart host. The server render and the first client render show the prerendered SVG. The
 * Runtime controller then adopts it, and Vue never writes the surface content again. The
 * \`tooltip\` slot or prop wins over a registered Tooltip. The \`fallbackTooltip\` slot or prop
 * renders when no Tooltip is registered.
 */
export default defineComponent({
  name: "${displayName(facts, "surface")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "surface")}
  },
  setup(props, { attrs, expose, slots }) {
    const root = ${n.useInternalRoot}();
    const element = ref<HTMLDivElement | null>(null);
    const prerender = () => {
      ${chartPrerender(facts)}
    };
    // Computed once, so Vue keeps the server markup and never rewrites the adopted surface.
    let initial = prerender();
    // A parts chart registers its parts after this setup. On the server, the render waits for the
    // sibling parts to set up, so the SVG draws them.
    if (root.partsMode) onServerPrefetch(() => void (initial = prerender()));
    const size = computed(() => {
      ${chartSpecSurfaceStyle()}
    });

    // Vue does not track slots. Every update of this part reads which tooltip slots exist, so a
    // slot that a parent adds or removes after mount changes the winner and the body handler.
    const readSlots = () => ({
      tooltip: slots.tooltip !== undefined,
      fallbackTooltip: slots.fallbackTooltip !== undefined,
    });
    const slotState = shallowRef(readSlots());
    onBeforeUpdate(() => {
      const next = readSlots();
      if (
        next.tooltip !== slotState.value.tooltip ||
        next.fallbackTooltip !== slotState.value.fallbackTooltip
      )
        slotState.value = next;
    });

    const content = computed<(() => unknown) | null>(() => {
      ${chartTooltipResolution({
        native: [{ when: "props.nativeTooltip", value: "null" }],
        explicit: [
          { when: "slotState.value.tooltip", value: "() => slots.tooltip?.()" },
          {
            bind: ["tooltip", "props.tooltip"],
            when: "tooltip !== undefined && tooltip !== null",
            value: `() => ${n.view}(tooltip)`,
          },
        ],
        registered: [
          {
            bind: ["registered", "root.tooltip"],
            when: "registered",
            value: "() => registered.render()",
          },
        ],
        fallback: [
          { when: "slotState.value.fallbackTooltip", value: "() => slots.fallbackTooltip?.()" },
          {
            bind: ["fallback", "props.fallbackTooltip"],
            when: "fallback !== undefined && fallback !== null",
            value: `() => ${n.view}(fallback)`,
          },
        ],
      })}
    });
    ${chartTooltipBody(ops)}
    provide(${n.bodyKey}, portalBody);

    let controller: ReturnType<typeof ${facts.runtime.factory}> | null = null;
    let applied: ChartSurfaceSettings | null = null;
    ${chartSurfaceLifecycle(ops, facts)}
    const syncBody = () => {
      ${chartTooltipAccessibility(facts, "portalBody.value")}
    };

    // Pages that start charts destroy a controller whose root left the document, as KeepAlive
    // does with a deactivated chart. Activation then starts a new controller.
    onActivated(() => {
      const chartRoot = chartRootElement();
      if (!controller || !chartRoot || ${facts.runtime.getController}(chartRoot) === controller) return;
      stop();
      start();
    });
    watch(portalBody, syncBody, { flush: "post" });
    onUpdated(syncBody);
    expose({ element });

    return () => [
      h(
        "${facts.parts.surface.element}",
        mergeProps({ style: size.value }, attrs, {
          ref: element,
          // A parts chart learns its size from parts that register after this first render, so
          // the browser keeps the server size during hydration.
          "data-allow-mismatch": root.partsMode ? "style" : undefined,
          "data-sw-chart-surface": "",
          "data-slot": "${slot(facts, "surface")}",
          innerHTML: initial.markup,
        }),
      ),
      portalBody.value && content.value
        ? h(Teleport, { to: portalBody.value.element }, [h(content.value as () => null)])
        : null,
    ];
  },
});
`);
}

function printTooltip(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  type VNode,
} from "vue";
${contextImport(facts, [`type ${n.entry}`, n.useBody, n.useOptionalInternalRoot, `use${facts.displayName}SpecOptions`])}

${doc(facts, "tooltip")}
export default defineComponent({
  name: "${displayName(facts, "tooltip")}",
  props: {
${vueOptionProps(facts, "tooltip", "    ")}
  },
  setup(props, { slots }) {
    const root = ${n.useOptionalInternalRoot}();
    const inBody = ${n.useBody}() !== null;
    // Its chart-level options reach a parts chart. A Tooltip inside a tooltip body sets none.
    if (!inBody) use${facts.displayName}SpecOptions(() => (${chartSpecOptionsRead(facts, "tooltip")}));
    // One stable registration per part, so a parent re-render keeps its place in the order.
    const version = shallowRef(0);
    const entry: ${n.entry} = {
      render() {
        void version.value;
        return slots.default?.();
      },
    };
    let unregister: (() => void) | undefined;
    onMounted(() => {
      if (!inBody && root) unregister = root.registerTooltip(entry);
    });
    // New slot content re-renders this part, so the surface renders the body again.
    onUpdated(() => {
      if (unregister) version.value += 1;
    });
    onBeforeUnmount(() => {
      unregister?.();
      unregister = undefined;
    });
    return () => (inBody ? (slots.default?.() as VNode[] | undefined) : null);
  },
});
`);
}

function printTooltipContent(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const d = facts.displayName;
  const h = facts.runtime.helpers;
  return sfc(`
import { type ChartFormat, type TooltipItem, ${h.tooltipLayout} } from "${facts.runtime.importSource}";
import { type PropType, type VNodeChild, computed, defineComponent, h, mergeProps, provide } from "vue";
${contextImport(facts, [
  "type ChartView",
  `type ${d}TooltipContentState`,
  n.contentKey,
  n.spaced,
  n.useBody,
  n.useInternalRoot,
])}

${doc(facts, "tooltipContent")}
export default defineComponent({
  name: "${displayName(facts, "tooltipContent")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "tooltipContent")}
  },
  setup(props, { attrs, slots }) {
    const body = ${n.useBody}();
    const root = ${n.useInternalRoot}();
    const state = computed<${d}TooltipContentState | null>(() => {
      const target = body?.value;
      if (!target) return null;
      // The Runtime applies the content rules: defined props win over the module preset.
      const layout = ${h.tooltipLayout}<ChartView>(
        target,
        root.config,
        typeof root.chart === "object" ? root.chart.presentation : undefined,
        ${chartTooltipLayoutOptions(facts, "vue", (name) => `props.${name}`)},
      );
      return { ...layout, body: target };
    });
    provide(${n.contentKey}, state);

    return () => {
      const value = state.value;
      if (!value) return null;
      return h(
        "${facts.parts.tooltipContent.element}",
        mergeProps(attrs, {
          "data-slot": "${slot(facts, "tooltipContent")}",
          "${facts.attrs.chartId}": root.id,
          "data-indicator": value.indicator,
          "data-nested": String(value.nested),
        }),
        ${n.spaced}(slots.default?.()),
      );
    };
  },
});
`);
}

function printTooltipLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useContent, n.view])}

${doc(facts, "tooltipLabel")}
export default defineComponent({
  name: "${displayName(facts, "tooltipLabel")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const content = ${n.useContent}();
    return () => {
      const value = content?.value;
      if (!value || value.nested || !value.showLabel) return null;
      return h(
        "${facts.parts.tooltipLabel.element}",
        mergeProps(attrs, { "data-slot": "${slot(facts, "tooltipLabel")}" }),
        [${n.view}(value.heading)],
      );
    };
  },
});
`);
}

function printTooltipItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h } from "vue";
${contextImport(facts, [n.provider, n.useContent])}

${doc(facts, "tooltipItems")}
export default defineComponent({
  name: "${displayName(facts, "tooltipItems")}",
  setup(_, { slots }) {
    const content = ${n.useContent}();
    return () => {
      const value = content?.value;
      if (!value) return null;
      return value.view.rows.flatMap((row, index) => [
        ...(index === 0 ? [] : [" "]),
        h(
          ${n.provider},
          {
            key: row.key,
            row: { ...value.rows[index]!, index, row },
          },
          { default: () => slots.default?.() },
        ),
      ]);
    };
  },
});
`);
}

function printTooltipItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.spaced, n.useRow, n.view])}

${doc(facts, "tooltipItem")}
export default defineComponent({
  name: "${displayName(facts, "tooltipItem")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "tooltipItem")}
  },
  setup(props, { attrs, slots }) {
    const context = ${n.useRow}();
    return () => {
      const value = context?.value;
      if (!value) return null;
      const { row, active } = value;
      const { class: className, ...rest } = attrs;
      return h(
        "${facts.parts.tooltipItem.element}",
        mergeProps(rest, {
          class: row.hasCustom ? (props.customClass ?? className) : className,
          "data-slot": "${slot(facts, "tooltipItem")}",
          "data-active": String(active),
          "data-key": row.item.dataKey,
          "aria-hidden": "true",
        }),
        row.hasCustom ? [${n.view}(row.custom)] : ${n.spaced}(slots.default?.()),
      );
    };
  },
});
`);
}

function printTooltipIndicator(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useRow])}

${doc(facts, "tooltipIndicator")}
export default defineComponent({
  name: "${displayName(facts, "tooltipIndicator")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const context = ${n.useRow}();
    return () => {
      const row = context?.value.showIndicator ? context.value.row : undefined;
      if (!row) return null;
      return h(
        "${facts.parts.tooltipIndicator.element}",
        mergeProps(
          row.color ? { style: { "${facts.attrs.indicatorColorVariable}": row.color } } : {},
          attrs,
          { "data-slot": "${slot(facts, "tooltipIndicator")}" },
        ),
      );
    };
  },
});
`);
}

function printTooltipIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.icon, n.useRow])}

${doc(facts, "tooltipIcon")}
export default defineComponent({
  name: "${displayName(facts, "tooltipIcon")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const context = ${n.useRow}();
    return () => {
      const row = context?.value.row;
      if (!row?.icon) return null;
      return h(
        "${facts.parts.tooltipIcon.element}",
        mergeProps(row.color ? { style: { color: row.color } } : {}, attrs, {
          "data-slot": "${slot(facts, "tooltipIcon")}",
          "aria-hidden": "true",
        }),
        [${n.icon}(row.icon)],
      );
    };
  },
});
`);
}

function printTooltipName(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useContent, n.useRow, n.view])}

${doc(facts, "tooltipName")}
export default defineComponent({
  name: "${displayName(facts, "tooltipName")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "tooltipName")}
  },
  setup(props, { attrs }) {
    const content = ${n.useContent}();
    const context = ${n.useRow}();
    return () => {
      const value = content?.value;
      const row = context?.value.row;
      if (!value || !row) return null;
      const nested = context!.value.nestHeading;
      return h(
        "${facts.parts.tooltipName.element}",
        mergeProps(attrs, { "data-slot": "${slot(facts, "tooltipName")}" }),
        [
          nested
            ? h("span", { class: props.labelClass, "data-slot": "${slot(facts, "tooltipLabel")}" }, [
                ${n.view}(value.heading),
              ])
            : null,
          nested ? " " : null,
          ${n.view}(row.name),
        ],
      );
    };
  },
});
`);
}

function printTooltipValue(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useRow, n.view])}

${doc(facts, "tooltipValue")}
export default defineComponent({
  name: "${displayName(facts, "tooltipValue")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const context = ${n.useRow}();
    return () => {
      const row = context?.value.row;
      if (!row) return null;
      return h(
        "${facts.parts.tooltipValue.element}",
        mergeProps(attrs, { "data-slot": "${slot(facts, "tooltipValue")}" }),
        [${n.view}(row.value)],
      );
    };
  },
});
`);
}

function printLegend(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { computed, defineComponent, h, mergeProps, provide } from "vue";
${contextImport(facts, [n.legendKey])}

${doc(facts, "legend")}
export default defineComponent({
  name: "${displayName(facts, "legend")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "legend")}
  },
  setup(props, { attrs, slots }) {
    provide(
      ${n.legendKey},
      computed(() => ({ hideIcon: props.hideIcon })),
    );
    return () =>
      h(
        "${facts.parts.legend.element}",
        mergeProps({ role: "group", "aria-label": "${facts.defaults.legendAriaLabel}" }, attrs, {
          "data-slot": "${slot(facts, "legend")}",
        }),
        slots.default?.(),
      );
  },
});
`);
}

function printLegendItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h } from "vue";
${contextImport(facts, [n.provider, n.useInternalRoot])}

${doc(facts, "legendItems")}
export default defineComponent({
  name: "${displayName(facts, "legendItems")}",
  setup(_, { slots }) {
    const root = ${n.useInternalRoot}();
    return () =>
      root.legendKeys.map((key) =>
        h(${n.provider}, { key, legendKey: key }, { default: () => slots.default?.() }),
      );
  },
});
`);
}

function printLegendItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { ${facts.runtime.helpers.configText} } from "${facts.runtime.importSource}";
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.provider, n.useKey, n.useRoot])}

${doc(facts, "legendItem")}
export default defineComponent({
  name: "${displayName(facts, "legendItem")}",
  inheritAttrs: false,
  props: {
${runtimeProps(facts, "legendItem")}
  },
  setup(props, { attrs, slots }) {
    const root = ${n.useRoot}();
    const contextKey = ${n.useKey}();
    return () => {
      const key = props.value ?? contextKey?.value;
      if (key == null)
        throw new Error(${JSON.stringify(chartLegendKeyMessage(facts))});
      const entry = root.config[key];
      const rich = entry?.label;
      const plain = rich == null || typeof rich === "string" || typeof rich === "number";
      const ariaLabel =
        (attrs["aria-label"] as string | undefined) ?? (plain ? undefined : ${facts.runtime.helpers.configText}(entry, key));
      const on = root.visible.includes(key);
      const inner = () => [
        h(${n.provider}, { legendKey: key }, { default: () => slots.default?.() }),
      ];

      if (!(props.interactive ?? root.mode === "source")) {
        // A passive item keeps only presentational attributes.
        const kept = Object.fromEntries(
          ["id", "class", "style", "title"]
            .filter((name) => attrs[name] !== undefined)
            .map((name) => [name, attrs[name]]),
        );
        return h(
          "span",
          {
            ...kept,
            "aria-label": ariaLabel,
            "data-key": key,
            "data-slot": "${slot(facts, "legendItem")}",
          },
          inner(),
        );
      }

      const { onClick, ...rest } = attrs as Record<string, unknown> & {
        onClick?: ((event: MouseEvent) => void) | Array<(event: MouseEvent) => void>;
      };
      return h(
        "${facts.parts.legendItem.element}",
        mergeProps(rest, {
          type: "button",
          "aria-label": ariaLabel,
          "aria-pressed": on,
          "data-state": on ? "on" : "off",
          "data-key": key,
          "data-slot": "${slot(facts, "legendItem")}",
          onClick: (event: MouseEvent) => {
            ${chartLegendToggle(
              "for (const listener of Array.isArray(onClick) ? onClick : onClick ? [onClick] : []) listener(event);",
              "event",
              "(event.currentTarget as Element | null) ?? undefined",
            )}
          },
        }),
        inner(),
      );
    };
  },
});
`);
}

function printLegendSwatch(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useKey, n.useLegend, n.useRoot])}

${doc(facts, "legendSwatch")}
export default defineComponent({
  name: "${displayName(facts, "legendSwatch")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const root = ${n.useRoot}();
    const key = ${n.useKey}();
    const legend = ${n.useLegend}();
    return () => {
      const value = key?.value;
      if (value == null || (root.config[value]?.icon && !legend.hideIcon)) return null;
      return h(
        "${facts.parts.legendSwatch.element}",
        mergeProps({ style: { background: \`var(${facts.attrs.seriesColorVariablePrefix}\${value})\` } }, attrs, {
          "data-slot": "${slot(facts, "legendSwatch")}",
          "aria-hidden": "true",
        }),
      );
    };
  },
});
`);
}

function printLegendIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.icon, n.useKey, n.useLegend, n.useRoot])}

${doc(facts, "legendIcon")}
export default defineComponent({
  name: "${displayName(facts, "legendIcon")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const root = ${n.useRoot}();
    const key = ${n.useKey}();
    const legend = ${n.useLegend}();
    return () => {
      const value = key?.value;
      const icon = value == null ? undefined : root.config[value]?.icon;
      if (value == null || !icon || legend.hideIcon) return null;
      return h(
        "${facts.parts.legendIcon.element}",
        mergeProps({ style: { color: \`var(${facts.attrs.seriesColorVariablePrefix}\${value})\` } }, attrs, {
          "data-slot": "${slot(facts, "legendIcon")}",
          "aria-hidden": "true",
        }),
        [${n.icon}(icon)],
      );
    };
  },
});
`);
}

function printLegendLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  return sfc(`
import { defineComponent, h, mergeProps } from "vue";
${contextImport(facts, [n.useKey, n.useRoot, n.view])}

${doc(facts, "legendLabel")}
export default defineComponent({
  name: "${displayName(facts, "legendLabel")}",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const root = ${n.useRoot}();
    const key = ${n.useKey}();
    return () => {
      const value = key?.value;
      if (value == null) return null;
      const rich = root.config[value]?.label;
      const plain = rich == null || typeof rich === "string" || typeof rich === "number";
      return h(
        "${facts.parts.legendLabel.element}",
        mergeProps(attrs, { "data-slot": "${slot(facts, "legendLabel")}" }),
        [plain ? root.label(value) : ${n.view}(rich)],
      );
    };
  },
});
`);
}

/** A chart spec part registers its props with the Root and renders nothing. */
function printSpecPart(facts: ChartSurfaceFacts, part: ChartSpecPartName): string {
  const spec = facts.specParts[part];
  const props = chartSpecPartProps(facts, part, "vue")
    .map((prop) => {
      // A boolean or object prop keeps Vue boolean casting, so a bare `dot` reads as true. The
      // contract marks it, and another union with a boolean must say which it is.
      if (
        prop.type !== "boolean" &&
        !prop.booleanOrObject &&
        /(^|\|)\s*boolean\s*(\||$)/.test(prop.type)
      )
        throw new Error(
          `Chart prop "${prop.name}" mixes boolean with another type. Mark it booleanOrObject in the contract, or change the type.`,
        );
      const option =
        prop.type === "boolean"
          ? "Boolean"
          : prop.booleanOrObject
            ? `[Boolean, Object] as PropType<${spec.exportName}Props["${prop.name}"]>`
            : `null as unknown as PropType<${spec.exportName}Props["${prop.name}"]>`;
      return [
        prop.description ? chartComment(prop.description, "block", "    ") : "",
        `    ${prop.name}: { type: ${option}, ${prop.required ? "required: true" : "default: undefined"} },`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  return sfc(`
import { type PropType, defineComponent } from "vue";
${contextImport(facts, [`type ${spec.exportName}Props`, `use${facts.displayName}SpecPart`])}

${chartComment(chartSpecPartDoc(facts, part), "block")}
export default defineComponent({
  name: "${facts.displayName}.${spec.namespaceKey}",
  chartSpecPart: "${spec.kind}",
  props: {
${props.includes("Boolean") ? "    // An explicit undefined default keeps an absent boolean from turning into false.\n" : ""}${props}
  },
  setup(props) {
    use${facts.displayName}SpecPart("${spec.kind}", props);
    return () => null;
  },
});
`);
}

export function printVueChartSurfaceIndex({ facts }: VueChartSurfaceIndexProjection): string {
  const n = names(facts);
  const surfaceParts = Object.values(facts.parts);
  const specParts = Object.values(facts.specParts);
  const parts = [...surfaceParts, ...specParts];
  const imports = parts
    .map((part) => `import ${part.exportName}Component from "./${part.exportName}.vue";`)
    .join("\n");
  const partNames = new Set(surfaceParts.map((part) => `${part.exportName}Props`));
  // The Root accepts any chart types, so a generic wrapper can pass its typed props through. The
  // component keeps the single-file component's options and instance, and replaces only its
  // \`$props\` with the Root props union, so a template rejects an invalid source or visibility
  // combination. DefineComponent would merge the union into one object type. The definition
  // branch leaves out the two listener props there, so the component emits type inline listeners
  // on a source chart. The Root rejects a listener on a definition at setup.
  const typed = parts
    .map((part) =>
      part.name === "root"
        ? `const ${part.exportName} = ${part.exportName}Component as unknown as ${n.root}TemplateComponent;`
        : `const ${part.exportName} = ${part.exportName}Component as unknown as DefineComponent<${part.exportName}Props>;`,
    )
    .join("\n");
  const listeners = `"${facts.visibility.callbackProp}" | "onUpdate:${facts.visibility.controlledProp}"`;
  const rootComponent = `type ${n.root}Sfc = typeof ${n.root}Component;
type ${n.root}TemplateComponent = Omit<${n.root}Sfc, never> & {
  call?: never;
  new (...args: any[]): Omit<InstanceType<${n.root}Sfc>, "$props"> & {
    $props: (
      | ${n.root}SourceProps<any, any, any, any>
      | Omit<${n.root}DefinitionProps<any, any, any, any>, ${listeners}>
      | ${n.root}SpecProps<any, any, any, any>
    ) &
      VNodeProps &
      AllowedComponentProps &
      ComponentCustomProps;
  };
};`;
  const members = parts.map((part) => `  ${part.namespaceKey}: ${part.exportName},`).join("\n");
  const named = parts.map((part) => `  ${part.exportName},`).join("\n");
  const partProps = surfaceParts
    .filter((part) => part.name !== "root")
    .map(
      (part) =>
        `export type ${part.exportName}Props${part.name === "tooltipContent" ? "<T = unknown>" : ""} = ${propsType(facts, part.name)};`,
    )
    .join("\n");

  const types = chartPublicTypes(facts);
  // The index declares the part props. The other public types live in the context module.
  const contextTypes = [
    ...types.all,
    ...types.context,
    ...types.rootUnion,
    ...types.specParts,
  ].filter((name) => !partNames.has(name) || name === `${n.root}Props`);
  const localTypes = [
    "ChartView",
    `${n.root}DefinitionProps`,
    `${n.root}SourceProps`,
    `${n.root}SpecProps`,
    ...types.specParts,
  ];

  return `import type { ChartFormat, ChartSource, TooltipItem } from "${facts.runtime.importSource}";
import type {
  AllowedComponentProps,
  ComponentCustomProps,
  DefineComponent,
  VNodeChild,
  VNodeProps,
} from "vue";
${imports}
import type { ${localTypes.join(", ")} } from "./${n.context}.js";

${partProps}

${rootComponent}

${typed}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${facts.exports.namespace} as ${facts.exports.namespaceAlias},
${named}
};
export default ${facts.exports.namespace};

export { ${n.useBody}, ${n.useRoot} } from "./${n.context}.js";
export type { ${contextTypes.join(", ")} } from "./${n.context}.js";
export type { ChartFormat, ChartSource };

export type {
${facts.exports.helperTypes
  .filter((name) => name !== "ChartSource" && name !== "ChartFormat")
  .map((name) => `  ${name},`)
  .join("\n")}
} from "${facts.exports.runtimeImportSource}";
export { ${facts.exports.helperValues.join(", ")} } from "${facts.exports.runtimeImportSource}";
`;
}

/**
 * The Vue props declarations of the chart-level spec options that a part sets. An explicit
 * undefined default keeps an absent boolean from turning into false, so the Runtime default
 * applies.
 */
function vueOptionProps(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  indent: string,
): string {
  return chartSpecOptions(facts, part)
    .map((prop) => {
      const type =
        prop.type === "boolean" ? "Boolean" : `null as unknown as PropType<${prop.type}>`;
      return `${prop.description ? `${chartComment(prop.description, "block", indent)}\n` : ""}${indent}${prop.name}: { type: ${type}, default: undefined },`;
    })
    .join("\n");
}

/** The spec options object of a part from its Vue props. */
function chartSpecOptionsRead(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return `{ ${chartSpecOptions(facts, part)
    .map(({ name }) => `${name}: props.${name}`)
    .join(", ")} }`;
}

/** The public props type of a part. Parts without contract props take only attributes and slots. */
function propsType(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  const fields = vueProps(facts, part).map(
    (prop) =>
      `${prop.description ? `${chartComment(prop.description, "block", "  ")}\n` : ""}  ${prop.name}?: ${chartPropType(prop, words(prop))};`,
  );
  return fields.length > 0 ? `{\n${fields.join("\n")}\n}` : "Record<never, never>";
}
