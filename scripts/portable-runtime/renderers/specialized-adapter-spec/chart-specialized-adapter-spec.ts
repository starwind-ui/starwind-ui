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
  runtime: {
    factory: string;
    getController: string;
    helpers: {
      configText: string;
      isIcon: string;
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

/** Adapter composition per part. Elements, data-slots and props come from the contract. */
type ChartPartRecipe = {
  doc?: string;
  iterates?: ChartSurfacePartFacts["iterates"];
  role: ChartSurfacePartRole;
};

const CHART_PART_RECIPES: Record<ChartSurfacePartName, ChartPartRecipe> = {
  root: { role: "root" },
  style: { doc: "Writes the config color rules for light and dark themes.", role: "config-style" },
  surface: { role: "surface" },
  tooltip: {
    doc: "Inside a chart root, the first Tooltip supplies the tooltip body. Removing it hands over to the next one or to the default. Inside a tooltip body it renders its content in place. Elsewhere it renders nothing.",
    role: "tooltip-registration",
  },
  tooltipContent: {
    doc: "The tooltip body content. It renders inside a tooltip body only, and gives its parts the presentation rows through context.",
    role: "tooltip-content",
  },
  tooltipLabel: {
    doc: "The tooltip heading. It renders nothing when the heading is hidden, empty or nested in a row.",
    role: "tooltip-heading",
  },
  tooltipItems: {
    doc: "Renders its content once per tooltip row, with that row in context.",
    iterates: "tooltip-rows",
    role: "tooltip-rows",
  },
  tooltipItem: {
    doc: "One tooltip row. Rows stay hidden from assistive technology, because the Runtime keeps the native status label in sync with the visible text. A formatter row renders the formatter view.",
    role: "tooltip-row",
  },
  tooltipIndicator: {
    doc: "The row color marker. A row with an icon or a hidden indicator renders nothing.",
    role: "tooltip-row-indicator",
  },
  tooltipIcon: {
    doc: "The config icon of a row. A row without an icon renders nothing.",
    role: "tooltip-row-icon",
  },
  tooltipName: {
    doc: "The row name. One line or dashed row nests the heading inside it.",
    role: "tooltip-row-name",
  },
  tooltipValue: { doc: "The formatted row value.", role: "tooltip-row-value" },
  legend: { doc: "A group of legend items.", role: "legend" },
  legendItems: {
    doc: "Renders its content once per config key, with that key in context.",
    iterates: "legend-keys",
    role: "legend-keys",
  },
  legendItem: {
    doc: "A legend toggle for one config key. A click handler that calls `preventDefault()` cancels the toggle. The item requests the change itself, so the Runtime root listener does not toggle it.",
    role: "legend-item",
  },
  legendSwatch: {
    doc: "The series color swatch. It renders nothing when the legend shows the config icon.",
    role: "legend-swatch",
  },
  legendIcon: {
    doc: "The config icon of a legend item. It renders nothing without an icon or with `hideIcon`.",
    role: "legend-icon",
  },
  legendLabel: {
    doc: "The config label of a legend item: a rich label, or its plain text.",
    role: "legend-label",
  },
};

const CHART_HELPER_VALUES = ["defineChartModule", "isChartIcon", "tooltipView"] as const;
const CHART_HELPER_TYPES = [
  "ChartContext",
  "ChartFactory",
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
    runtime: {
      factory: spec.root.runtimeFactory,
      getController: "getChartController",
      helpers: {
        configText: "configText",
        isIcon: "isChartIcon",
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
    ...(recipe.doc ? { doc: recipe.doc } : {}),
    ...(element ? { element } : {}),
    exportName: `${spec.displayName}${namespaceKey}`,
    forwardsRef: part.forwardsRef === true,
    ...(recipe.iterates ? { iterates: recipe.iterates } : {}),
    name,
    namespaceKey,
    props: contract.props
      .filter((prop) => prop.targets?.includes(name))
      .map((prop) => ({
        ...(prop.classHook ? { classHook: true as const } : {}),
        ...(prop.defaultValue !== undefined ? { defaultValue: prop.defaultValue } : {}),
        ...(prop.description ? { description: prop.description } : {}),
        kind: prop.kind,
        name: prop.name,
        ...(prop.required ? { required: true } : {}),
        type: prop.type,
        ...(prop.unsupportedTargets ? { unsupportedTargets: [...prop.unsupportedTargets] } : {}),
      })),
    role: recipe.role,
  };
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
    rootUnion: [`${n.root}SourceProps`, `${n.root}DefinitionProps`],
  };
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
