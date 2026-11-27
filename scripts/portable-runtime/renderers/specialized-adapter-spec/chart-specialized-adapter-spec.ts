import {
  chartSpecOptionNames,
  chartSpecPartNames,
} from "../../contracts/primitive/components/chart.js";
import type {
  FrameworkTarget,
  PrimitiveFixedModelOwnership,
  PrimitivePropContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFamilyProjection,
  AdapterComponentFile,
  AdapterFamilyIndexProjection,
  AdapterIndexFile,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

/** Primitive part names, in namespace order. Tickets for other targets reuse these names. */
export const CHART_SURFACE_PART_NAMES = [
  "root",
  "style",
  "surface",
  "tooltip",
  "tooltipContent",
  "tooltipLabel",
  "tooltipItems",
  "tooltipItem",
  "tooltipIndicator",
  "tooltipIcon",
  "tooltipName",
  "tooltipValue",
  "legend",
  "legendItems",
  "legendItem",
  "legendSwatch",
  "legendIcon",
  "legendLabel",
] as const;

export type ChartSurfacePartName = (typeof CHART_SURFACE_PART_NAMES)[number];

/**
 * Chart spec part names, in namespace order, from the chart contract. Each name is also the `kind`
 * of its Runtime `ChartPart`. The parts render no element: they describe the chart as data.
 */
export const CHART_SPEC_PART_NAMES = chartSpecPartNames;

export type ChartSpecPartName = (typeof CHART_SPEC_PART_NAMES)[number];

/**
 * Chart-level spec option names, from the chart contract. Each is a prop of one part and a field
 * of the Runtime `ChartSpec` beside `parts`.
 */
export const CHART_SPEC_OPTION_NAMES = chartSpecOptionNames;

export type ChartSpecOptionName = (typeof CHART_SPEC_OPTION_NAMES)[number];

/** A chart-level spec option: its contract prop and the part that sets it. */
export type ChartSpecOptionFacts = ChartSurfacePropFacts & {
  name: ChartSpecOptionName;
  part: ChartSurfacePartName;
};

export type ChartSpecPartFacts = {
  discoveryAttribute: string;
  /** What the part adds to the chart, for the part's doc comment. */
  doc: string;
  exportName: string;
  /** The Runtime `ChartPart` kind. */
  kind: ChartSpecPartName;
  name: ChartSpecPartName;
  namespaceKey: string;
  /** The contract props that target this part, in contract order. */
  props: ChartSurfacePropFacts[];
};

/**
 * What a part does in the adapter. Runtime behavior stays in the Runtime controller; these roles
 * name only adapter composition.
 */
export type ChartSurfacePartRole =
  | "root"
  | "config-style"
  | "surface"
  | "tooltip-registration"
  | "tooltip-content"
  | "tooltip-heading"
  | "tooltip-rows"
  | "tooltip-row"
  | "tooltip-row-indicator"
  | "tooltip-row-icon"
  | "tooltip-row-name"
  | "tooltip-row-value"
  | "legend"
  | "legend-keys"
  | "legend-item"
  | "legend-swatch"
  | "legend-icon"
  | "legend-label";

export type ChartSurfacePartFacts = {
  dataSlot?: string;
  discoveryAttribute: string;
  /** What the part does, for the part's doc comment. Root and Surface docs name the framework. */
  doc?: string;
  element?: string;
  exportName: string;
  forwardsRef: boolean;
  /** Children render once per tooltip row or once per config key. */
  iterates?: "tooltip-rows" | "legend-keys";
  name: ChartSurfacePartName;
  namespaceKey: string;
  /** The contract props that target this part, in contract order. */
  props: ChartSurfacePropFacts[];
  role: ChartSurfacePartRole;
};

export type ChartSurfacePropFacts = Pick<
  PrimitivePropContract,
  | "booleanOrObject"
  | "classHook"
  | "defaultValue"
  | "description"
  | "kind"
  | "name"
  | "required"
  | "type"
  | "unsupportedTargets"
>;

export type ChartSurfaceFacts = {
  attrs: {
    chartId: "data-chart";
    indicatorColorVariable: "--sw-chart-indicator-color";
    seriesColorVariablePrefix: "--sw-chart-color-";
  };
  defaults: {
    indicator: "dot";
    legendAriaLabel: string;
  };
  displayName: string;
  exports: {
    helperTypes: string[];
    helperValues: string[];
    /** The named namespace export, as in every generated Primitive index. */
    namespace: string;
    /** A second name for the namespace, matching the default import name in docs. */
    namespaceAlias: string;
    runtimeImportSource: RuntimeAdapterContract["runtime"]["importSource"];
  };
  /** The fixed ownership of the visible model, read from the Runtime Adapter Contract. */
  ownership: PrimitiveFixedModelOwnership;
  parts: Record<ChartSurfacePartName, ChartSurfacePartFacts>;
  /** The chart spec parts. The chart Root collects them, in source order, into a `ChartSpec`. */
  specParts: Record<ChartSpecPartName, ChartSpecPartFacts>;
  /**
   * The chart-level spec options, in contract order. The Root reads its own options from its props.
   * Another part, such as the Tooltip, registers its options with the Root.
   */
  specOptions: ChartSpecOptionFacts[];
  runtime: {
    factory: string;
    getController: string;
    helpers: {
      configText: string;
      isIcon: string;
      legendKeys: string;
      prerender: string;
      style: string;
      syncTooltipAccessibility: string;
      toId: string;
      tooltipLayout: string;
      tooltipView: string;
      visibleKeys: string;
    };
    importSource: RuntimeAdapterContract["runtime"]["importSource"];
  };
  visibility: {
    callbackProp: string;
    controlledProp: string;
    defaultProp: string;
    domEvent: string;
    valueProperty: string;
  };
};

export type ChartSurfaceComponentProjection = {
  facts: ChartSurfaceFacts;
  kind: "chart-surface";
  part: ChartSurfacePartName;
};

export type ChartSurfaceIndexProjection = {
  facts: ChartSurfaceFacts;
  kind: "chart-surface";
};

export type ChartSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  chart: {
    adapterKind: "engine-surface-chart";
    facts: ChartSurfaceFacts;
    runtimeBoundary: string[];
  };
};

const CHART_RUNTIME_BOUNDARY = [
  "TanStack renderer creation, prerender and adoption",
  "scales, layout, hit testing and keyboard focus movement",
  "tooltip placement, pinning and dismissal",
  "visibility requests and the cancelable visible-change event",
  "config color styles and validation",
  "tooltip body targets and the accessible status label",
  "teardown",
] as const;

/**
 * Adapter composition per part. Elements, data-slots, docs and props come from the contract.
 */
type ChartPartRecipe = {
  /**
   * Added to the contract description in the part doc comment. Only targets with component
   * context print part doc comments, so the note can name context behavior.
   */
  contextNote?: string;
  iterates?: ChartSurfacePartFacts["iterates"];
  role: ChartSurfacePartRole;
};

const CHART_PART_RECIPES: Record<ChartSurfacePartName, ChartPartRecipe> = {
  root: { role: "root" },
  style: { role: "config-style" },
  surface: { role: "surface" },
  tooltip: {
    contextNote: "Removing it hands over to the next one or to the default.",
    role: "tooltip-registration",
  },
  tooltipContent: {
    contextNote: "It gives its parts the presentation rows through context.",
    role: "tooltip-content",
  },
  tooltipLabel: { role: "tooltip-heading" },
  tooltipItems: { iterates: "tooltip-rows", role: "tooltip-rows" },
  tooltipItem: { role: "tooltip-row" },
  tooltipIndicator: { role: "tooltip-row-indicator" },
  tooltipIcon: { role: "tooltip-row-icon" },
  tooltipName: { role: "tooltip-row-name" },
  tooltipValue: { role: "tooltip-row-value" },
  legend: { role: "legend" },
  legendItems: { iterates: "legend-keys", role: "legend-keys" },
  legendItem: {
    contextNote:
      "The item requests the change itself, so the Runtime root listener does not toggle it.",
    role: "legend-item",
  },
  legendSwatch: { role: "legend-swatch" },
  legendIcon: { role: "legend-icon" },
  legendLabel: { role: "legend-label" },
};

/** The discovery attribute prefix that marks a chart spec part in the contract. */
const CHART_SPEC_PART_ATTRIBUTE = "data-sw-chart-part-";

const CHART_HELPER_VALUES = ["defineChartModule", "isChartIcon", "tooltipView"] as const;
const CHART_HELPER_TYPES = [
  "ChartContext",
  "ChartFactory",
  "ChartFormat",
  "ChartIcon",
  "ChartModule",
  "ChartSource",
  "NativeHostOptions",
  "TooltipContentOptions",
  "TooltipItem",
  "TooltipView",
] as const;

export function buildChartSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): ChartSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "chart") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Chart specialized adapter spec.`,
    );
  }

  const parts = Object.fromEntries(
    CHART_SURFACE_PART_NAMES.map((name) => [name, buildPartFacts(spec, contract, name)]),
  ) as Record<ChartSurfacePartName, ChartSurfacePartFacts>;
  const specParts = Object.fromEntries(
    CHART_SPEC_PART_NAMES.map((name) => [name, buildSpecPartFacts(spec, contract, name)]),
  ) as Record<ChartSpecPartName, ChartSpecPartFacts>;

  const visibleModel = contract.stateModels?.find((model) => model.name === "visible");
  const visibleEvent = contract.events?.find((event) => event.name === "visibleChange");
  if (!visibleModel?.controlledProp || !visibleModel.defaultProp) {
    throw new Error("Chart specialized adapter spec requires the visible state model.");
  }
  if (visibleModel.ownership?.laterDefined !== "silent-command") {
    throw new Error("Chart specialized adapter spec requires fixed visible model ownership.");
  }
  if (!visibleEvent?.domEvent || !visibleEvent.valueProperty || visibleEvent.cancelable !== true) {
    throw new Error("Chart specialized adapter spec requires the cancelable visibleChange event.");
  }

  const facts: ChartSurfaceFacts = {
    attrs: {
      chartId: "data-chart",
      indicatorColorVariable: "--sw-chart-indicator-color",
      seriesColorVariablePrefix: "--sw-chart-color-",
    },
    defaults: { indicator: "dot", legendAriaLabel: "Chart series" },
    displayName: spec.displayName,
    exports: {
      helperTypes: [...CHART_HELPER_TYPES],
      helperValues: [...CHART_HELPER_VALUES],
      namespace: spec.displayName,
      namespaceAlias: `${spec.displayName}Primitive`,
      runtimeImportSource: spec.root.runtimeImportSource,
    },
    ownership: { ...visibleModel.ownership },
    parts,
    specParts,
    specOptions: CHART_SPEC_OPTION_NAMES.map((name) => buildSpecOptionFacts(contract, name)),
    runtime: {
      factory: spec.root.runtimeFactory,
      getController: "getChartController",
      helpers: {
        configText: "configText",
        isIcon: "isChartIcon",
        legendKeys: "chartLegendKeys",
        prerender: "prerenderChart",
        style: "chartStyle",
        syncTooltipAccessibility: "syncTooltipAccessibility",
        toId: "toChartId",
        tooltipLayout: "tooltipLayout",
        tooltipView: "tooltipView",
        visibleKeys: "visibleKeys",
      },
      importSource: spec.root.runtimeImportSource,
    },
    visibility: {
      callbackProp: visibleEvent.callbackProp,
      controlledProp: visibleModel.controlledProp,
      defaultProp: visibleModel.defaultProp,
      domEvent: visibleEvent.domEvent,
      valueProperty: visibleEvent.valueProperty,
    },
  };

  return {
    ...spec,
    files: [
      ...CHART_SURFACE_PART_NAMES.map((name) => ({
        exportName: parts[name].exportName,
        kind: "part" as const,
        part: name,
        path: `${spec.component}/${parts[name].exportName}`,
      })),
      {
        exportName: facts.exports.namespace,
        kind: "index" as const,
        path: `${spec.component}/index.ts`,
      },
    ],
    sourcePrimitiveContract: contract,
    chart: {
      adapterKind: "engine-surface-chart",
      facts,
      runtimeBoundary: [...CHART_RUNTIME_BOUNDARY],
    },
  };
}

export function buildChartAdapterOutputModel(
  spec: ChartSpecializedAdapterSpec,
): AdapterOutputModel {
  const errors = validateChartSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Chart output model cannot print invalid Chart spec:\n${errors.join("\n")}`);
  }

  const facts = spec.chart.facts;
  return {
    files: [
      ...CHART_SURFACE_PART_NAMES.map((part) => createComponentFile(spec, facts, part)),
      createIndexFile(spec, facts),
    ],
  } satisfies AdapterOutputModel;
}

export function validateChartSpecializedAdapterSpec(spec: ChartSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (spec.component !== "chart") {
    errors.push("Chart specialized adapter spec must target the chart primitive.");
    return errors;
  }
  if (spec.chart?.adapterKind !== "engine-surface-chart") {
    errors.push('Chart specialized adapter spec adapterKind must be "engine-surface-chart".');
    return errors;
  }

  const facts = spec.chart.facts;
  const slots = new Set<string>();
  for (const name of CHART_SURFACE_PART_NAMES) {
    const part = facts.parts[name];
    if (!part) {
      errors.push(`Chart specialized adapter spec is missing part "${name}".`);
      continue;
    }
    if (part.dataSlot) {
      if (slots.has(part.dataSlot)) errors.push(`Duplicate chart data-slot "${part.dataSlot}".`);
      slots.add(part.dataSlot);
    }
    if (!part.element && !part.iterates && part.role !== "tooltip-registration") {
      errors.push(`Chart part "${name}" needs an element, row iteration or registration role.`);
    }
  }
  for (const name of CHART_SPEC_PART_NAMES) {
    if (!facts.specParts?.[name])
      errors.push(`Chart specialized adapter spec is missing spec part "${name}".`);
  }
  // The part name lists follow the contract parts, in contract order.
  const contractParts = spec.sourcePrimitiveContract?.parts ?? [];
  const contractSpecParts = contractParts
    .filter((part) => part.discoveryAttribute.startsWith(CHART_SPEC_PART_ATTRIBUTE))
    .map((part) => part.name);
  const contractSurfaceParts = contractParts
    .filter((part) => !part.discoveryAttribute.startsWith(CHART_SPEC_PART_ATTRIBUTE))
    .map((part) => part.name);
  if (contractSpecParts.join() !== CHART_SPEC_PART_NAMES.join())
    errors.push(
      `CHART_SPEC_PART_NAMES must list the contract spec parts in order: ${contractSpecParts.join(", ")}.`,
    );
  if (contractSurfaceParts.join() !== CHART_SURFACE_PART_NAMES.join())
    errors.push(
      `CHART_SURFACE_PART_NAMES must list the other contract parts in order: ${contractSurfaceParts.join(", ")}.`,
    );
  if (facts.runtime.importSource !== "@starwind-ui/runtime/chart") {
    errors.push("Chart adapters import only the @starwind-ui/runtime/chart subpath.");
  }
  return errors;
}

function buildPartFacts(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
  name: ChartSurfacePartName,
): ChartSurfacePartFacts {
  const part = contract.parts.find((candidate) => candidate.name === name);
  if (!part) throw new Error(`Chart specialized adapter spec requires part "${name}".`);
  const recipe = CHART_PART_RECIPES[name];
  const dataSlot = part.initialAttributes?.find(
    (attr) => attr.name === "data-slot" && attr.source === "constant",
  )?.value;
  // A template part renders no element of its own: the Runtime fills or repeats its content.
  const element = part.defaultElement === "template" ? undefined : part.defaultElement;
  const namespaceKey = `${name[0]!.toUpperCase()}${name.slice(1)}`;
  return {
    ...(dataSlot ? { dataSlot } : {}),
    discoveryAttribute: part.discoveryAttribute,
    ...(part.description
      ? { doc: [part.description, recipe.contextNote].filter(Boolean).join(" ") }
      : {}),
    ...(element ? { element } : {}),
    exportName: `${spec.displayName}${namespaceKey}`,
    forwardsRef: part.forwardsRef === true,
    ...(recipe.iterates ? { iterates: recipe.iterates } : {}),
    name,
    namespaceKey,
    props: propFacts(contract, name),
    role: recipe.role,
  };
}

function buildSpecPartFacts(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
  name: ChartSpecPartName,
): ChartSpecPartFacts {
  const part = contract.parts.find((candidate) => candidate.name === name);
  if (!part) throw new Error(`Chart specialized adapter spec requires spec part "${name}".`);
  if (!part.description) throw new Error(`Chart spec part "${name}" needs a contract description.`);
  const namespaceKey = `${name[0]!.toUpperCase()}${name.slice(1)}`;
  return {
    discoveryAttribute: part.discoveryAttribute,
    doc: part.description,
    exportName: `${spec.displayName}${namespaceKey}`,
    kind: name,
    name,
    namespaceKey,
    props: propFacts(contract, name),
  };
}

function buildSpecOptionFacts(
  contract: RuntimeAdapterContract,
  name: ChartSpecOptionName,
): ChartSpecOptionFacts {
  const props = contract.props.filter((prop) => prop.name === name);
  const part = props[0]?.targets?.[0] as ChartSurfacePartName | undefined;
  if (props.length !== 1 || props[0]!.targets?.length !== 1 || !part)
    throw new Error(`Chart spec option "${name}" needs one contract prop with one target part.`);
  if (!(CHART_SURFACE_PART_NAMES as readonly string[]).includes(part))
    throw new Error(`Chart spec option "${name}" must target a chart part, not "${part}".`);
  return { ...propFacts(contract, part).find((prop) => prop.name === name)!, name, part };
}

function propFacts(contract: RuntimeAdapterContract, part: string): ChartSurfacePropFacts[] {
  return contract.props
    .filter((prop) => prop.targets?.includes(part))
    .map((prop) => ({
      ...(prop.booleanOrObject ? { booleanOrObject: true as const } : {}),
      ...(prop.classHook ? { classHook: true as const } : {}),
      ...(prop.defaultValue !== undefined ? { defaultValue: prop.defaultValue } : {}),
      ...(prop.description ? { description: prop.description } : {}),
      kind: prop.kind,
      name: prop.name,
      ...(prop.required ? { required: true } : {}),
      type: prop.type,
      ...(prop.unsupportedTargets ? { unsupportedTargets: [...prop.unsupportedTargets] } : {}),
    }));
}

function createComponentFile(
  spec: ChartSpecializedAdapterSpec,
  facts: ChartSurfaceFacts,
  partName: ChartSurfacePartName,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const family: ChartSurfaceComponentProjection = { facts, kind: "chart-surface", part: partName };

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${spec.displayName}.${part.namespaceKey}`,
      events: [],
      exports: { kind: "namespace", members: [], namespace: part.exportName },
      // The chart family projection stays local to the chart spec and its target homes.
      family: family as unknown as AdapterComponentFamilyProjection,
      imports: [],
      lifecycle: undefined,
      name: part.exportName,
      portals: [],
      props: [],
      refs: [],
      render: {
        attrs: [],
        children: [],
        defaultElement: part.element ?? "template",
        events: [],
        kind: "element",
        part: part.name,
        refs: [],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${part.exportName}`,
  };
}

function createIndexFile(
  spec: ChartSpecializedAdapterSpec,
  facts: ChartSurfaceFacts,
): AdapterIndexFile {
  const family: ChartSurfaceIndexProjection = { facts, kind: "chart-surface" };
  return {
    exports: {
      kind: "namespace",
      members: CHART_SURFACE_PART_NAMES.map((name) => ({
        from: `./${facts.parts[name].exportName}`,
        name: facts.parts[name].exportName,
      })),
      namespace: facts.exports.namespace,
    },
    family: family as unknown as AdapterFamilyIndexProjection,
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

/** The public hook, state and part names that every target derives from the facts. */
export function chartNames(facts: ChartSurfaceFacts) {
  const d = facts.displayName;
  const root = facts.parts.root.exportName;
  return {
    context: `${d}Context`,
    contentState: `${d}TooltipContentState`,
    entry: `${d}TooltipEntry`,
    internalState: `${root}InternalState`,
    legendState: `${d}LegendState`,
    provider: `${d}ContextProvider`,
    root,
    rowState: `${d}TooltipRowState`,
    spaced: `spaced${d}Parts`,
    state: `${root}State`,
    useBody: `use${d}TooltipBody`,
    useContent: `use${d}TooltipContent`,
    useKey: `use${d}LegendKey`,
    useLegend: `use${d}Legend`,
    useInternalRoot: `use${root}Internal`,
    useOptionalInternalRoot: `useOptional${root}Internal`,
    useRoot: `use${root}`,
    useRow: `use${d}TooltipRow`,
  };
}

/**
 * The public type names of a chart index, besides the Runtime helper types.
 * - `all`: every target exports these, with a props type for every part.
 * - `context`: view and state types that a public hook returns. Astro has no component context,
 *   so it leaves them out.
 * - `rootUnion`: the two halves of the Root props union. Every target exports them.
 */
export function chartPublicTypes(facts: ChartSurfaceFacts) {
  const d = facts.displayName;
  const n = chartNames(facts);
  return {
    all: [
      `${d}Config`,
      `${d}Definition`,
      `${d}Value`,
      ...CHART_SURFACE_PART_NAMES.map((part) => `${facts.parts[part].exportName}Props`),
    ],
    // Only state that a public hook returns. Part-local tooltip and legend states stay internal.
    context: [`${d}View`, `${d}TooltipBody`, n.state],
    rootUnion: [`${n.root}SourceProps`, `${n.root}DefinitionProps`, `${n.root}SpecProps`],
    /** The props types of the chart spec parts. */
    specParts: CHART_SPEC_PART_NAMES.map((part) => `${facts.specParts[part].exportName}Props`),
  };
}

/** The contract props of a chart spec part that a target supports. */
export function chartSpecPartProps(
  facts: ChartSurfaceFacts,
  part: ChartSpecPartName,
  target: FrameworkTarget,
): ChartSurfacePropFacts[] {
  return facts.specParts[part].props.filter((prop) => !prop.unsupportedTargets?.includes(target));
}

/**
 * The props type of each chart spec part, from the contract props. `tickFormatter` maps the
 * contract's `ChartTickFormatter` to the target's formatter type.
 */
export function printChartSpecPartTypes(
  facts: ChartSurfaceFacts,
  target: FrameworkTarget,
  tickFormatter = "ChartTickFormatter",
): string {
  return CHART_SPEC_PART_NAMES.map((name) =>
    printChartSpecPartType(facts, name, target, tickFormatter),
  ).join("\n\n");
}

/**
 * The doc comment text of a chart spec part component in a target with component context. Astro
 * has no context, so the chart Root reads its parts from markers and Astro writes its own text.
 */
export function chartSpecPartDoc(facts: ChartSurfaceFacts, name: ChartSpecPartName): string {
  return `${facts.specParts[name].doc} It registers its props with the chart Root in source order and renders nothing.`;
}

/** The props type of one chart spec part, with its doc comment. */
export function printChartSpecPartType(
  facts: ChartSurfaceFacts,
  name: ChartSpecPartName,
  target: FrameworkTarget,
  tickFormatter = "ChartTickFormatter",
): string {
  const part = facts.specParts[name];
  const fields = chartSpecPartProps(facts, name, target)
    .map(
      (prop) =>
        `${prop.description ? `${chartComment(prop.description, "block", "  ")}\n` : ""}  ${prop.name}${prop.required ? "" : "?"}: ${prop.type.replace(/\bChartTickFormatter\b/g, tickFormatter)};`,
    )
    .join("\n");
  return `${chartComment(part.doc, "block")}\nexport type ${part.exportName}Props = {\n${fields}\n};`;
}

/**
 * The props that each chart spec part sends, by part kind, and the reader that keeps only a part's
 * own defined props. `delegate` gives a function prop a stable stand-in that calls the latest
 * function, so the spec keeps its value. The registry also stores the raw functions, so a new
 * function draws the chart again with the new result.
 */
export function printChartSpecPartReader(
  facts: ChartSurfaceFacts,
  target: FrameworkTarget,
): string {
  return `${printChartSpecPartPropsTable(facts, target)}

/** A prop value by name, or by a path such as \`"label.formatter"\` for a function in an object prop. */
export function readChartSpecProp(props: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      props,
    );
}

/** The function fields of an object prop, such as the \`formatter\` of a \`label\` object. */
function nestedFunctionNames(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value).filter(
    (key) => typeof (value as Record<string, unknown>)[key] === "function",
  );
}

/**
 * A plain copy of a prop value. Arrays and plain objects copy field by field, also through a
 * reactive proxy, so a reactive read of the part sees each nested field, and an edit in place, such
 * as a new label formatter prefix or gradient stop color, gives a part that differs from the last
 * one. Functions and other objects stay as they are.
 */
function plainChartSpecValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plainChartSpecValue);
  if (!value || typeof value !== "object") return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, plainChartSpecValue(entry)]),
  );
}

/**
 * One chart spec part from its props. The part keeps only its own defined props, as plain copies.
 * A function prop, or a function in an object prop, becomes its stable delegate.
 */
export function readChartSpecPart(
  kind: ChartPart["kind"],
  props: Record<string, unknown>,
  delegate?: (name: string) => (...args: any[]) => unknown,
): ChartPart {
  const part: Record<string, unknown> = { kind };
  for (const name of CHART_SPEC_PART_PROPS[kind]) {
    const value = props[name];
    if (value === undefined) continue;
    if (delegate && typeof value === "function") {
      part[name] = delegate(name);
      continue;
    }
    const copy = plainChartSpecValue(value);
    const nested = delegate ? nestedFunctionNames(copy) : [];
    part[name] = nested.length
      ? {
          ...(copy as Record<string, unknown>),
          ...Object.fromEntries(nested.map((key) => [key, delegate!(\`\${name}.\${key}\`)])),
        }
      : copy;
  }
  return part as unknown as ChartPart;
}

/**
 * The raw function props of one chart spec part, by name or path. A function with a new identity
 * draws the chart again, so a formatter that reads new state shows its new text.
 */
export function readChartSpecFunctions(
  kind: ChartPart["kind"],
  props: Record<string, unknown>,
): Record<string, unknown> {
  const functions: Record<string, unknown> = {};
  for (const name of CHART_SPEC_PART_PROPS[kind]) {
    const value = props[name];
    if (typeof value === "function") functions[name] = value;
    for (const key of nestedFunctionNames(value))
      functions[\`\${name}.\${key}\`] = (value as Record<string, unknown>)[key];
  }
  return functions;
}

/** Throws for a chart spec part inside a Root that has \`chart\` or \`definition\`. */
export function assertChartSpecPartRoot(partsMode: boolean): void {
  if (!partsMode)
    throw new TypeError(
      ${JSON.stringify(CHART_MESSAGES.partsMix)},
    );
}`;
}

/**
 * The \`CHART_SPEC_PART_PROPS\` table: the props that each chart spec part sends, by part kind, from
 * the contract props that the target supports.
 */
export function printChartSpecPartPropsTable(
  facts: ChartSurfaceFacts,
  target: FrameworkTarget,
): string {
  const props = CHART_SPEC_PART_NAMES.map((name) => {
    const keys = chartSpecPartProps(facts, name, target)
      .map((prop) => `"${prop.name}"`)
      .join(", ");
    return `  ${facts.specParts[name].kind}: [${keys}],`;
  }).join("\n");
  return `/** The props that each chart spec part sends, by part kind. */
const CHART_SPEC_PART_PROPS: Record<ChartPart["kind"], readonly string[]> = {
${props}
};`;
}

/** Adapter error messages that read the same in every target. */
export const CHART_MESSAGES = {
  partsMix:
    "Chart parts cannot be combined with chart or definition. Use chart parts, a chart module or a native definition, not more than one.",
  /** `names` lists the target's visibility props, as a user writes them. */
  definitionVisibility: (names: string) =>
    `Static native definitions own their visibility. Remove ${names}, or use a chart factory.`,
} as const;

/** The message for a part outside its chart Root. Astro has no context, so it does not use it. */
export function chartOutsideRootMessage(facts: ChartSurfaceFacts): string {
  return `${facts.displayName} parts must be rendered inside ${facts.displayName}.${facts.parts.root.namespaceKey}.`;
}

/** The message for a legend item without a config key. */
export function chartLegendKeyMessage(facts: ChartSurfaceFacts): string {
  const d = facts.displayName;
  return `${d}.${facts.parts.legendItem.namespaceKey} needs a value or a ${d}.${facts.parts.legendItems.namespaceKey} parent.`;
}

/**
 * One component file per chart spec part, copied from a chart part file. `kind` names the target's
 * spec part projection. A target inserts the files before its chart index.
 */
export function chartSpecPartFiles(
  facts: ChartSurfaceFacts,
  template: AdapterComponentFile,
  directory: string,
  kind: string,
  target?: AdapterComponentFile["target"],
): AdapterComponentFile[] {
  return CHART_SPEC_PART_NAMES.map((part) => ({
    ...template,
    component: {
      ...template.component,
      displayName: `${facts.displayName}.${facts.specParts[part].namespaceKey}`,
      family: { facts, kind, part } as unknown as AdapterComponentFile["component"]["family"],
      name: facts.specParts[part].exportName,
    },
    path: `${directory}/${facts.specParts[part].exportName}`,
    ...(target ? { target } : {}),
  }));
}

/** The data-slot of a part. Every rendered chart part needs one. */
export function chartSlot(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  const value = facts.parts[part].dataSlot;
  if (!value) throw new Error(`Chart part "${part}" needs a data-slot.`);
  return value;
}

/** The contract props of a part that a target supports. */
export function chartPartProps(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  target: FrameworkTarget,
): ChartSurfacePropFacts[] {
  return facts.parts[part].props.filter((prop) => !prop.unsupportedTargets?.includes(target));
}

/** One prop of a part. */
export function chartProp(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  name: string,
): ChartSurfacePropFacts {
  const prop = facts.parts[part].props.find((candidate) => candidate.name === name);
  if (!prop) throw new Error(`Chart part "${part}" has no prop "${name}".`);
  return prop;
}

/** The contract default of a part prop, as a TypeScript literal. */
export function chartPropDefault(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  name: string,
): string {
  const value = chartProp(facts, part, name).defaultValue;
  if (value === undefined) throw new Error(`Chart prop "${part}.${name}" has no contract default.`);
  return value;
}

/** The chart-level spec options that a part sets, in contract order. */
export function chartSpecOptions(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
): ChartSpecOptionFacts[] {
  return facts.specOptions.filter((option) => option.part === part);
}

/** The typed fields of the chart-level spec options that a part sets, with their doc comments. */
export function printChartSpecOptionFields(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  indent = "  ",
): string {
  return chartSpecOptions(facts, part)
    .map(
      (prop) =>
        `${prop.description ? `${chartComment(prop.description, "block", indent)}\n` : ""}${indent}${prop.name}?: ${prop.type};`,
    )
    .join("\n");
}

/**
 * The spec options object of a part, as a TypeScript expression. `read` gives the target's
 * expression for one prop. An undefined value drops when the Root builds the spec.
 */
export function chartSpecOptionsObject(
  facts: ChartSurfaceFacts,
  part: ChartSurfacePartName,
  read: (name: string) => string = (name) => name,
): string {
  const fields = chartSpecOptions(facts, part).map(({ name }) =>
    read(name) === name ? name : `${name}: ${read(name)}`,
  );
  return `{ ${fields.join(", ")} }`;
}

/**
 * The framework words for the placeholders in contract prop types: `ChartView` is a heading, label
 * or formatter view, `ChartContent` is body or slot content and `ChartClass` is a class value.
 * `T` replaces the datum type where a target cannot name a type parameter.
 */
export type ChartTypeWords = {
  ChartClass: string;
  ChartContent: string;
  ChartView: string;
  T?: string;
};

/** The placeholder words in contract prop types. No package exports them as these types. */
export const CHART_TYPE_PLACEHOLDERS = /\b(ChartClass|ChartContent|ChartView)\b/;

export function chartPropType(
  prop: Pick<ChartSurfacePropFacts, "type">,
  words: ChartTypeWords,
): string {
  const type = prop.type.replace(
    new RegExp(CHART_TYPE_PLACEHOLDERS.source, "g"),
    (word) => words[word as keyof ChartTypeWords]!,
  );
  return words.T ? type.replace(/\bT\b/g, words.T) : type;
}

/**
 * Wraps doc text in a comment. `block` gives a JSDoc comment and `line` gives `//` lines.
 * `indent` is the column where the comment starts.
 */
export function chartComment(
  text: string,
  style: "block" | "line",
  indent = "",
  width = 100,
): string {
  const prefix = style === "block" ? `${indent} * ` : `${indent}// `;
  if (style === "block" && indent.length + text.length + 7 <= width)
    return `${indent}/** ${text} */`;
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && prefix.length + line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  const body = lines.map((entry) => `${prefix}${entry}`).join("\n");
  return style === "block" ? `${indent}/**\n${body}\n${indent} */` : body;
}
