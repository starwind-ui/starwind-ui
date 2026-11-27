import {
  chartDefinitionGuard,
  chartFirstTooltip,
  chartLegendToggle,
  chartModelHelpers,
  chartPrerender,
  chartRootInputs,
  chartRootSpecOptions,
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
  chartSpecOptionsObject,
  chartSpecPartDoc,
  chartSpecPartFiles,
  printChartSpecOptionFields,
  printChartSpecPartReader,
  printChartSpecPartType,
} from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import { normalizeReactClassHookName } from "../future-readiness.js";
import type { AdapterComponentFile, AdapterOutputModel } from "../types.js";
import { reactChartOperations } from "./recipe-chart-operations.js";

export type ReactChartSurfaceComponentProjection = ChartSurfaceComponentProjection;
export type ReactChartSurfaceIndexProjection = ChartSurfaceIndexProjection;

/** A chart spec part. It registers its props with the Root and renders nothing. */
type ReactChartSpecPartProjection = {
  facts: ChartSurfaceFacts;
  kind: "react-chart-spec-part";
  part: ChartSpecPartName;
};

export function isReactChartSurfaceProjection(family: unknown): boolean {
  const kind = (family as { kind?: string } | undefined)?.kind;
  return kind === "chart-surface" || kind === "react-chart-spec-part";
}

/** Adds the chart spec part files before the chart index. */
export function projectReactChartSurfaceOutputModel(model: AdapterOutputModel): AdapterOutputModel {
  const index = model.files.find(
    (file) =>
      file.kind === "index" &&
      (file.family as { kind?: string } | undefined)?.kind === "chart-surface",
  );
  if (!index || index.kind !== "index") return model;
  const facts = (index.family as unknown as ReactChartSurfaceIndexProjection).facts;
  const template = model.files.find(
    (file): file is AdapterComponentFile =>
      file.kind === "component" &&
      (file.component.family as { kind?: string } | undefined)?.kind === "chart-surface",
  );
  if (!template) throw new Error("The React chart output needs a chart part file.");
  const directory = index.path.slice(0, index.path.lastIndexOf("/"));
  const specParts = chartSpecPartFiles(facts, template, directory, "react-chart-spec-part");
  const files = [...model.files];
  files.splice(files.indexOf(index), 0, ...specParts);
  return { files };
}

export function printReactChartSurfaceComponent(
  projection: ReactChartSurfaceComponentProjection | ReactChartSpecPartProjection,
): string {
  if (projection.kind === "react-chart-spec-part")
    return printSpecPart(projection.facts, projection.part);
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

export function printReactChartSurfaceIndex({ facts }: ReactChartSurfaceIndexProjection): string {
  const parts = [...Object.values(facts.parts), ...Object.values(facts.specParts)];
  const root = facts.parts.root.exportName;
  const imports = parts
    .map((part) => `import ${part.exportName} from "./${part.exportName}";`)
    .join("\n");
  const members = parts.map((part) => `  ${part.namespaceKey}: ${part.exportName},`).join("\n");
  const named = parts.map((part) => `  ${part.exportName},`).join("\n");
  const types = chartPublicTypes(facts);
  // Each type comes from the part file that declares it. Shared types live in the Root file.
  const homes: Record<string, string> = Object.fromEntries(
    parts.map((part) => [`${part.exportName}Props`, part.exportName]),
  );
  const byFile = new Map<string, string[]>();
  for (const name of [...types.all, ...types.context, ...types.rootUnion, ...types.specParts]) {
    const file = homes[name] ?? root;
    byFile.set(file, [...(byFile.get(file) ?? []), name]);
  }
  const typeExports = [...byFile]
    .map(([file, list]) => `export type { ${list.join(", ")} } from "./${file}";`)
    .join("\n");

  return `${imports}
import { use${root}, use${facts.displayName}TooltipBody } from "./${root}";

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${facts.exports.namespace} as ${facts.exports.namespaceAlias},
${named}
  use${root},
  use${facts.displayName}TooltipBody,
};

export default ${facts.exports.namespace};

export type {
${facts.exports.helperTypes.map((name) => `  ${name},`).join("\n")}
} from "${facts.exports.runtimeImportSource}";
export { ${facts.exports.helperValues.join(", ")} } from "${facts.exports.runtimeImportSource}";
${typeExports}
`;
}

function names(facts: ChartSurfaceFacts) {
  const d = facts.displayName;
  const root = facts.parts.root.exportName;
  return {
    ...chartNames(facts),
    bodyContext: `${d}TooltipBodyContext`,
    contentContext: `${d}TooltipContentContext`,
    icon: `${d}IconView`,
    keyContext: `${d}LegendKeyContext`,
    legendContext: `${d}LegendContext`,
    internalContext: `${root}InternalContext`,
    rootContext: `${root}Context`,
    rowContext: `${d}TooltipRowContext`,
  };
}

const slot = chartSlot;

const WORDS: ChartTypeWords = {
  ChartClass: "string",
  ChartContent: "React.ReactNode",
  ChartView: "React.ReactNode",
};

/** A destructured prop uses shorthand when its local name is the prop name. */
function bindingProperty(prop: string, local: string): string {
  return prop === local ? local : `${prop}: ${local}`;
}

/** A class hook follows the React `class` rule. */
function propName(prop: ChartSurfacePropFacts): string {
  return prop.classHook ? normalizeReactClassHookName(prop.name) : prop.name;
}

function propType(facts: ChartSurfaceFacts, part: ChartSurfacePartName, name: string): string {
  return chartPropType(chartProp(facts, part, name), WORDS);
}

/** The contract props of a part as type fields, each with its doc comment. */
function propFields(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return chartPartProps(facts, part, "react")
    .map(
      (prop) =>
        `${prop.description ? `${chartComment(prop.description, "block", "  ")}\n` : ""}  ${propName(prop)}?: ${chartPropType(prop, WORDS)};`,
    )
    .join("\n");
}

function doc(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return chartComment(facts.parts[part].doc!, "block");
}

function displayName(facts: ChartSurfaceFacts, part: ChartSurfacePartName): string {
  return `${facts.parts[part].exportName}.displayName = "${facts.displayName}.${facts.parts[part].namespaceKey}";`;
}

function rootImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `import { ${members.join(", ")} } from "./${facts.parts.root.exportName}";`;
}

function printRoot(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const h = facts.runtime.helpers;
  const v = facts.visibility;
  const ops = reactChartOperations(facts);
  return `import {
  type ChartConfig as RuntimeChartConfig,
  type ChartController,
  type ChartInput,
  type ChartModule,
  type ChartPart,
  type ChartSource,
  type ChartSpec,
  type ChartSpecOptions,
  type ChartToggleOptions,
  type ChartVisibleChangeDetails,
  type CreateChartOptions,
  type NativeHostOptions,
  buildChartSpec,
  ${h.legendKeys},
  ${h.configText},
  ${h.isIcon},
  isSameChartSpec,
  ${h.toId},
  ${h.visibleKeys},
} from "${facts.runtime.importSource}";
import * as React from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";

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

/** A React view value: a heading, a label or a formatter result. */
export type ${facts.displayName}View = React.ReactNode;

/** React chart config. Rich labels are React nodes and need \`text\`. Icons are components or portable icons. */
export type ChartConfig = RuntimeChartConfig<
  React.ReactNode,
  React.ComponentType<{ className?: string }>
>;

/** One Tooltip registration. The surface subscribes to the content of the first one. */
export interface ${n.entry} {
  getContent(): React.ReactNode;
  setContent(content: React.ReactNode): void;
  subscribe(listener: () => void): () => void;
}

export function create${n.entry}(content: React.ReactNode): ${n.entry} {
  let current = content;
  const listeners = new Set<() => void>();
  return {
    getContent: () => current,
    setContent(next) {
      if (Object.is(next, current)) return;
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

${chartRootState(n.state, n.internalState, n.entry, false)}

export const ${n.rootContext} = React.createContext<${n.state} | null>(null);
export const ${n.internalContext} = React.createContext<${n.internalState} | null>(null);
export const ${n.bodyContext} = React.createContext<ChartTooltipBody | null>(null);

${printChartSpecPartReader(facts, "react")}

/** A chart spec part component carries its part kind, so the Root finds it in its children. */
type ChartSpecPartType = { chartSpecPart?: ChartPart["kind"] };

const LAZY_TYPE = Symbol.for("react.lazy");
const MEMO_TYPE = Symbol.for("react.memo");

type WrappedType = {
  $$typeof?: symbol;
  type?: unknown;
  _payload?: unknown;
  _init?: (payload: unknown) => unknown;
};

/**
 * The component behind \`React.memo\` and loaded \`React.lazy\` types. A Server Component gets
 * client components as lazy references. A lazy type that still loads, or failed, stays wrapped.
 */
function unwrapChartPartType(type: unknown): unknown {
  for (let depth = 0; depth < 8 && type && typeof type === "object"; depth++) {
    const wrapped = type as WrappedType;
    if (wrapped.$$typeof === MEMO_TYPE) type = wrapped.type;
    else if (wrapped.$$typeof === LAZY_TYPE && wrapped._init) {
      try {
        type = wrapped._init(wrapped._payload);
      } catch {
        return undefined;
      }
    } else break;
  }
  return type;
}

/**
 * The spec parts among a Root's children, in source order, through arrays and fragments. The
 * first render draws them, because parts register after the Surface renders. A part inside
 * another component registers after mount.
 */
function collectChartSpec(children: React.ReactNode, parts: ChartPart[] = []): ChartPart[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<Record<string, unknown>>(child)) return;
    const type = unwrapChartPartType(child.type) as ChartSpecPartType | undefined;
    const kind = type?.chartSpecPart;
    if (kind) parts.push(readChartSpecPart(kind, child.props));
    else if (child.type === React.Fragment)
      collectChartSpec(child.props.children as React.ReactNode, parts);
  });
  return parts;
}

/**
 * Registers one chart spec part with the Root, in source order, and removes it on unmount. A prop
 * change updates the part in place. A function prop becomes a stable delegate that calls the
 * latest function. A function with a new identity draws the chart again, so an inline formatter
 * draws once per parent render, as in Recharts.
 */
export function use${facts.displayName}SpecPart(
  kind: ChartPart["kind"],
  props: Record<string, unknown>,
): void {
  const root = React.useContext(${n.internalContext});
  if (root) assertChartSpecPartRoot(root.partsMode);
  const latest = React.useRef(props);
  const [delegates] = React.useState(() => new Map<string, (...args: any[]) => unknown>());
  const delegate = (name: string) => {
    let call = delegates.get(name);
    if (!call) {
      call = (...args: any[]) => (readChartSpecProp(latest.current, name) as (...args: any[]) => unknown)(...args);
      delegates.set(name, call);
    }
    return call;
  };
  const part = readChartSpecPart(kind, props, delegate);
  const registration = React.useRef<ChartSpecRegistration | null>(null);
  const register = root?.registerSpecPart;
  useIsomorphicLayoutEffect(() => {
    if (!register) return;
    const current = register(part, readChartSpecFunctions(kind, props));
    registration.current = current;
    return () => {
      registration.current = null;
      current.remove();
    };
    // The registration keeps its place. Prop changes reach it through \`update\`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register]);
  useIsomorphicLayoutEffect(() => {
    latest.current = props;
    registration.current?.update(part, readChartSpecFunctions(kind, props));
  });
}

/**
 * Registers the chart-level options of a part, such as the Tooltip \`cursor\`, with a parts chart
 * Root. The registration keeps its place, and a prop change updates it in place. \`active\` false,
 * as in a tooltip body, registers nothing.
 */
export function use${facts.displayName}SpecOptions(options: ChartSpecOptions, active = true): void {
  const root = React.useContext(${n.internalContext});
  const register = active && root?.partsMode ? root.registerSpecOptions : undefined;
  const registration = React.useRef<ChartSpecOptionsRegistration | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!register) return;
    const current = register(options);
    registration.current = current;
    return () => {
      registration.current = null;
      current.remove();
    };
    // The registration keeps its place. Prop changes reach it through \`update\`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register]);
  useIsomorphicLayoutEffect(() => {
    registration.current?.update(options);
  });
}

/** The public chart state: config keys, visible keys and visibility requests. */
export function ${n.useRoot}(): ${n.state} {
  const context = React.useContext(${n.rootContext});
  if (!context) throw new Error(${JSON.stringify(chartOutsideRootMessage(facts))});
  return context;
}

export function ${n.useOptionalInternalRoot}(): ${n.internalState} | null {
  return React.useContext(${n.internalContext});
}

export function ${n.useInternalRoot}(): ${n.internalState} {
  const context = React.useContext(${n.internalContext});
  if (!context) throw new Error(${JSON.stringify(chartOutsideRootMessage(facts))});
  return context;
}

/** The tooltip body that the current tooltip content renders for, or \`null\` outside a body. */
export function ${n.useBody}(): ChartTooltipBody | null {
  return React.useContext(${n.bodyContext});
}

/**
 * Puts a space between tooltip parts. Grid and flex layouts do not render it, and the Runtime
 * reads it when it builds the accessible label from the visible text.
 */
export function ${n.spaced}(children: React.ReactNode): React.ReactNode {
  return React.Children.toArray(children).flatMap((child, index) =>
    index === 0 ? [child] : [" ", child],
  );
}

/** Portable icon data or a React icon component. No markup strings are parsed. */
export function ${n.icon}({ icon }: { icon: unknown }) {
  if (${h.isIcon}(icon)) {
    return (
      <svg
        viewBox={icon.viewBox ?? "0 0 24 24"}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        width="1em"
        height="1em"
        aria-hidden="true"
        focusable="false"
      >
        {icon.paths.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </svg>
    );
  }
  const Icon = icon as React.ComponentType<{ className?: string }>;
  return <Icon />;
}

type ${n.root}CommonProps<D, X extends ChartValue, Y extends ChartValue> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "children"
> & {
  /** Unique chart id. It scopes config colors and prefixes native ids. Generated when omitted. */
  id?: string;
  config: ChartConfig;
  params?: Record<string, unknown>;
  /** Native chart theme passed to the chart module context. */
  theme?: ChartInput["theme"];
  /** Native host options such as callbacks and sizing. */
  host?: NativeHostOptions<NoInfer<D>, NoInfer<X>, NoInfer<Y>>;
  /** Sets the native \`definition.tooltip\` to false. */
  disableTooltip?: boolean;
${printChartSpecOptionFields(facts, "root")}
  children?: React.ReactNode;
};

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
   * Visible keys. A defined value when the Root mounts makes the keys parent-controlled for the
   * Root's lifetime. Otherwise the Runtime owns them, and a later defined value is a silent
   * command. An empty array hides every series.
   */
  ${v.controlledProp}?: readonly string[];
  /** Initial visible keys when uncontrolled. Omit it to show every config key. */
  ${v.defaultProp}?: readonly string[];
  ${v.callbackProp}?: (${v.valueProperty}: string[], details: ChartVisibleChangeDetails) => void;
};

export type ${n.root}DefinitionProps<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> = ${n.root}CommonProps<D, X, Y> & {
  /** A static native definition. It owns its visibility, so the legend is passive. */
  definition: ChartDefinition<D, X, Y>;
  chart?: never;
  data?: readonly T[];
  ${v.controlledProp}?: never;
  ${v.defaultProp}?: never;
  ${v.callbackProp}?: never;
};

/**
 * Chart parts in the children, such as a bar and an x axis, describe the chart. It follows the
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

export type ${n.root}Props<
  T = unknown,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
> =
  | ${n.root}SourceProps<T, D, X, Y>
  | ${n.root}DefinitionProps<T, D, X, Y>
  | ${n.root}SpecProps<T, D, X, Y>;

const EMPTY: readonly never[] = [];

${chartModelHelpers}

function ${n.root}<
  T,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(props: ${n.root}Props<T, D, X, Y>) {
  const {
    id: idProp,
    chart,
    definition,
    data = EMPTY as readonly T[],
    config,
    params,
    theme,
    host,
    disableTooltip = false,
${chartSpecOptions(facts, "root")
  .map(({ name }) => `    ${name},`)
  .join("\n")}
    ${v.controlledProp}: visibleProp,
    ${bindingProperty(v.defaultProp, "defaultVisible")},
    ${bindingProperty(v.callbackProp, "onVisibleChange")},
    "aria-label": ariaLabel,
    children,
    ...rootProps
  } = props;
  const generatedId = React.useId();
  const id = idProp ?? ${h.toId}(generatedId);
  const mode = definition ? "definition" : "source";
  ${chartDefinitionGuard(ops, facts)}

  ${chartVisibleModel(ops, facts)}
  ${chartSpecRegistry(ops, facts)}
  ${chartRootInputs(ops, facts)}
  // The spec parts among the children draw the first render, on the server and in hydration. The
  // Surface starts once the Root settles, after the parts of the first render registered.
  const [seed] = React.useState(() => {
    if (!partsMode) return undefined;
    return buildChartSpec(collectChartSpec(children), ${chartRootSpecOptions(ops, facts)});
  });
  const [settled, setSettled] = React.useState(false);
  useIsomorphicLayoutEffect(() => setSettled(true), []);

  ${chartVisibleRequests(ops, facts)}

  ${chartTooltipRegistry(ops, n.entry)}
  const tooltip = ${chartFirstTooltip(ops)};

  ${chartRootStateValue(ops, facts, { name: "internal", type: n.internalState }, { name: "state", type: n.state })}

  return (
    <${n.internalContext}.Provider value={internal}>
      <${n.rootContext}.Provider value={state}>
        <${facts.parts.root.element}
          {...rootProps}
          aria-label={partsMode ? undefined : ariaLabel}
          data-slot="${slot(facts, "root")}"
          ${facts.attrs.chartId}={id}
        >
          {children}
        </${facts.parts.root.element}>
      </${n.rootContext}.Provider>
    </${n.internalContext}.Provider>
  );
}

${displayName(facts, "root")}

export default ${n.root};
`;
}

/**
 * A chart spec part registers its props with the Root and renders nothing. It carries its part
 * kind, so the Root finds it in its children for the server render.
 */
function printSpecPart(facts: ChartSurfaceFacts, part: ChartSpecPartName): string {
  const spec = facts.specParts[part];
  const name = spec.exportName;
  const formats = spec.props.some((prop) => prop.type.includes("ChartTickFormatter"));
  return `${formats ? `import type { ChartTickFormatter } from "${facts.runtime.importSource}";\n` : ""}${rootImport(facts, [`use${facts.displayName}SpecPart`])}

${printChartSpecPartType(facts, part, "react")}

${chartComment(chartSpecPartDoc(facts, part), "block")}
function ${name}(props: ${name}Props): null {
  use${facts.displayName}SpecPart("${spec.kind}", props);
  return null;
}

${name}.displayName = "${facts.displayName}.${spec.namespaceKey}";
// The chart Root reads the part kind when it finds this part in its children.
${name}.chartSpecPart = "${spec.kind}" as const;

export default ${name};
`;
}

function printStyle(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.style.exportName;
  return `import { ${facts.runtime.helpers.style} } from "${facts.runtime.importSource}";
import * as React from "react";
${rootImport(facts, [n.useRoot])}

export type ${name}Props = Omit<
  React.StyleHTMLAttributes<HTMLStyleElement>,
  "children" | "dangerouslySetInnerHTML"
>;

${doc(facts, "style")}
function ${name}(props: ${name}Props) {
  const { id, config } = ${n.useRoot}();
  // The Runtime validates the id, config keys and colors before it writes CSS.
  const css = React.useMemo(() => ${facts.runtime.helpers.style}(id, config), [id, config]);
  return <style {...props} data-slot="${slot(facts, "style")}" dangerouslySetInnerHTML={{ __html: css }} />;
}

${displayName(facts, "style")}

export default ${name};
`;
}

function printSurface(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const ops = reactChartOperations(facts);
  const name = facts.parts.surface.exportName;
  const h = facts.runtime.helpers;
  return `import {
  type ChartInput,
  chartSurfaceStyle,
  createChartOptions,
  ${facts.runtime.factory},
  ${h.prerender},
  ${h.syncTooltipAccessibility},
  ${h.visibleKeys},
  isChartSpecComplete,
  warnEmptyChart,
  warnIncompleteChart,
} from "${facts.runtime.importSource}";
import * as React from "react";
import { createPortal } from "react-dom";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
${rootImport(facts, [n.bodyContext, `type ChartTooltipBody`, `type ${n.entry}`, n.useInternalRoot])}

export type ${name}Props = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "dangerouslySetInnerHTML"
> & {
${propFields(facts, "surface")}
};

function toStyleObject(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of css.split(";")) {
    const index = declaration.indexOf(":");
    if (index < 1) continue;
    const property = declaration.slice(0, index).trim();
    const value = declaration.slice(index + 1).trim();
    style[property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value;
  }
  return style as React.CSSProperties;
}

${chartSurfaceHelpers}

function ${n.entry}Outlet({ entry }: { entry: ${n.entry} }) {
  const content = React.useSyncExternalStore(entry.subscribe, entry.getContent, entry.getContent);
  return <>{content}</>;
}

/**
 * The chart host. The server render and the first client render show the prerendered SVG. The
 * Runtime controller then adopts it, and React never writes the surface content again.
 */
const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(function ${name}(
  { tooltip, fallbackTooltip, nativeTooltip = ${chartPropDefault(facts, "surface", "nativeTooltip")}, style, ...props },
  forwardedRef,
) {
  const root = ${n.useInternalRoot}();
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [initial] = React.useState(() => {
    const result = (() => {
      ${chartPrerender(facts)}
    })();
    return { html: { __html: result.markup }, surfaceStyle: result.surfaceStyle };
  });
  const size = React.useMemo(() => {
    ${chartSpecSurfaceStyle()}
  }, [root, initial.surfaceStyle]);
  const surfaceStyle = React.useMemo(() => ({ ...toStyleObject(size), ...style }), [size, style]);

  const content: React.ReactNode = (() => {
    ${chartTooltipResolution({
      native: [{ when: "nativeTooltip", value: "null" }],
      explicit: [{ when: "tooltip !== undefined && tooltip !== null", value: "tooltip" }],
      registered: [
        {
          bind: ["registered", "root.tooltip"],
          when: "registered",
          value: `<${n.entry}Outlet entry={registered} />`,
        },
      ],
      fallback: [{ when: "fallbackTooltip !== undefined", value: "fallbackTooltip" }],
    })}
  })();
  ${chartTooltipBody(ops)}

  const controllerRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | null>(null);
  const applied = React.useRef<ChartSurfaceSettings | null>(null);
  ${chartSurfaceLifecycle(ops, facts)}

  useIsomorphicLayoutEffect(() => {
    ${chartTooltipAccessibility(facts, "portalBody")}
  });

  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      surfaceRef.current = node;
      setRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  return (
    <>
      <${facts.parts.surface.element}
        {...props}
        ref={ref}
        style={surfaceStyle}
        ${facts.parts.surface.discoveryAttribute}=""
        data-slot="${slot(facts, "surface")}"
        dangerouslySetInnerHTML={initial.html}
      />
      {portalBody
        ? createPortal(
            <${n.bodyContext}.Provider value={portalBody}>{content}</${n.bodyContext}.Provider>,
            portalBody.element,
          )
        : null}
    </>
  );
});

${displayName(facts, "surface")}

export default ${name};
`;
}

function printTooltip(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltip.exportName;
  return `import * as React from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
${rootImport(facts, [`create${n.entry}`, n.bodyContext, n.useOptionalInternalRoot, `use${facts.displayName}SpecOptions`])}

export type ${name}Props = {
${propFields(facts, "tooltip")}
};

${doc(facts, "tooltip")}
function ${name}({ children, ${chartSpecOptions(facts, "tooltip")
    .map(({ name: option }) => option)
    .join(", ")} }: ${name}Props) {
  const root = ${n.useOptionalInternalRoot}();
  const body = React.useContext(${n.bodyContext});
  // Its chart-level options reach a parts chart. A Tooltip inside a tooltip body sets none.
  use${facts.displayName}SpecOptions(${chartSpecOptionsObject(facts, "tooltip")}, !body);
  // One stable registration per part, so a parent re-render keeps its place in the order.
  const [entry] = React.useState(() => create${n.entry}(children));
  useIsomorphicLayoutEffect(() => {
    entry.setContent(children);
  });
  const register = root?.registerTooltip;
  useIsomorphicLayoutEffect(
    () => (body || !register ? undefined : register(entry)),
    [body, register, entry],
  );
  return body ? <>{children}</> : null;
}

${displayName(facts, "tooltip")}

export default ${name};
`;
}

function printTooltipContent(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipContent.exportName;
  const h = facts.runtime.helpers;
  return `import {
  type ChartFormat,
  type TooltipItem,
  type TooltipLayoutRow,
  type TooltipView,
  ${h.tooltipLayout},
} from "${facts.runtime.importSource}";
import * as React from "react";
${rootImport(facts, [n.bodyContext, `type ChartTooltipBody`, n.spaced, n.useInternalRoot])}

export interface ${n.contentState} {
  body: ChartTooltipBody;
  heading: React.ReactNode;
  hideIndicator: boolean;
  indicator: ${propType(facts, "tooltipContent", "indicator")};
  nested: boolean;
  showLabel: boolean;
  view: TooltipView<React.ReactNode>;
  /** The flags of each row: active, the color marker and the nested heading. */
  rows: TooltipLayoutRow[];
}

export const ${n.contentContext} = React.createContext<${n.contentState} | null>(null);

export function ${n.useContent}(): ${n.contentState} | null {
  return React.useContext(${n.contentContext});
}

export type ${name}Props<T = unknown> = Omit<React.HTMLAttributes<HTMLDivElement>, "color"> & {
${propFields(facts, "tooltipContent")}
};

${doc(facts, "tooltipContent")}
const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(function ${name}(
  {
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
    ...props
  },
  forwardedRef,
) {
  const body = React.useContext(${n.bodyContext});
  const root = ${n.useInternalRoot}();
  if (!body) return null;
  // The Runtime applies the content rules: defined props win over the module preset.
  const layout = ${h.tooltipLayout}<React.ReactNode>(
    body,
    root.config,
    typeof root.chart === "object" ? root.chart.presentation : undefined,
    ${chartTooltipLayoutOptions(facts, "react")},
  );
  const value: ${n.contentState} = { ...layout, body, heading: layout.heading as React.ReactNode };

  return (
    <${n.contentContext}.Provider value={value}>
      <${facts.parts.tooltipContent.element}
        {...props}
        ref={forwardedRef}
        data-slot="${slot(facts, "tooltipContent")}"
        ${facts.attrs.chartId}={root.id}
        data-indicator={layout.indicator}
        data-nested={String(layout.nested)}
      >
        {${n.spaced}(children)}
      </${facts.parts.tooltipContent.element}>
    </${n.contentContext}.Provider>
  );
}) as (<T = unknown>(
  props: ${name}Props<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null) & { displayName?: string };

${displayName(facts, "tooltipContent")}

export default ${name};
`;
}

function contentImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `import { ${members.join(", ")} } from "./${facts.parts.tooltipContent.exportName}";`;
}

function itemsImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `import { ${members.join(", ")} } from "./${facts.parts.tooltipItems.exportName}";`;
}

function printTooltipLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipLabel.exportName;
  return `import * as React from "react";
${contentImport(facts, [n.useContent])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

${doc(facts, "tooltipLabel")}
const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(function ${name}(props, forwardedRef) {
  const content = ${n.useContent}();
  if (!content || content.nested || !content.showLabel) return null;
  return (
    <${facts.parts.tooltipLabel.element} {...props} ref={forwardedRef} data-slot="${slot(facts, "tooltipLabel")}">
      {content.heading}
    </${facts.parts.tooltipLabel.element}>
  );
});

${displayName(facts, "tooltipLabel")}

export default ${name};
`;
}

function printTooltipItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipItems.exportName;
  return `import type { TooltipLayoutRow, TooltipViewRow } from "${facts.runtime.importSource}";
import * as React from "react";
${contentImport(facts, [n.useContent])}

export interface ${n.rowState} extends TooltipLayoutRow {
  index: number;
  row: TooltipViewRow<React.ReactNode>;
}

export const ${n.rowContext} = React.createContext<${n.rowState} | null>(null);

export function ${n.useRow}(): ${n.rowState} | null {
  return React.useContext(${n.rowContext});
}

export type ${name}Props = {
${propFields(facts, "tooltipItems")}
};

${doc(facts, "tooltipItems")}
function ${name}({ children }: ${name}Props) {
  const content = ${n.useContent}();
  if (!content) return null;
  return (
    <>
      {content.view.rows.map((row, index) => (
        <React.Fragment key={row.key}>
        {index === 0 ? null : " "}
        <${n.rowContext}.Provider
          value={{ ...content.rows[index]!, index, row }}
        >
          {children}
        </${n.rowContext}.Provider>
        </React.Fragment>
      ))}
    </>
  );
}

${displayName(facts, "tooltipItems")}

export default ${name};
`;
}

function printTooltipItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipItem.exportName;
  const custom = propName(chartProp(facts, "tooltipItem", "customClass"));
  return `import * as React from "react";
${rootImport(facts, [n.spaced])}
${itemsImport(facts, [n.useRow])}

export type ${name}Props = React.HTMLAttributes<HTMLDivElement> & {
${propFields(facts, "tooltipItem")}
};

${doc(facts, "tooltipItem")}
const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(function ${name}(
  { ${custom}, className, children, ...props },
  forwardedRef,
) {
  const context = ${n.useRow}();
  if (!context) return null;
  const { row, active } = context;
  return (
    <${facts.parts.tooltipItem.element}
      {...props}
      ref={forwardedRef}
      className={row.hasCustom ? (${custom} ?? className) : className}
      data-slot="${slot(facts, "tooltipItem")}"
      data-active={String(active)}
      data-key={row.item.dataKey}
      aria-hidden="true"
    >
      {row.hasCustom ? (row.custom as React.ReactNode) : ${n.spaced}(children)}
    </${facts.parts.tooltipItem.element}>
  );
});

${displayName(facts, "tooltipItem")}

export default ${name};
`;
}

function printTooltipIndicator(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipIndicator.exportName;
  return `import * as React from "react";
${itemsImport(facts, [n.useRow])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "tooltipIndicator")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(
  { style, ...props },
  forwardedRef,
) {
  const context = ${n.useRow}();
  if (!context?.showIndicator) return null;
  const color = context.row.color;
  return (
    <${facts.parts.tooltipIndicator.element}
      {...props}
      ref={forwardedRef}
      style={
        color
          ? ({ "${facts.attrs.indicatorColorVariable}": color, ...style } as React.CSSProperties)
          : style
      }
      data-slot="${slot(facts, "tooltipIndicator")}"
    />
  );
});

${displayName(facts, "tooltipIndicator")}

export default ${name};
`;
}

function printTooltipIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipIcon.exportName;
  return `import * as React from "react";
${rootImport(facts, [n.icon])}
${itemsImport(facts, [n.useRow])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "tooltipIcon")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(
  { style, ...props },
  forwardedRef,
) {
  const context = ${n.useRow}();
  if (!context?.row.icon) return null;
  const color = context.row.color;
  return (
    <${facts.parts.tooltipIcon.element}
      {...props}
      ref={forwardedRef}
      style={color ? { color, ...style } : style}
      data-slot="${slot(facts, "tooltipIcon")}"
      aria-hidden="true"
    >
      <${n.icon} icon={context.row.icon} />
    </${facts.parts.tooltipIcon.element}>
  );
});

${displayName(facts, "tooltipIcon")}

export default ${name};
`;
}

function printTooltipName(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipName.exportName;
  const labelClass = propName(chartProp(facts, "tooltipName", "labelClass"));
  return `import * as React from "react";
${contentImport(facts, [n.useContent])}
${itemsImport(facts, [n.useRow])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
${propFields(facts, "tooltipName")}
};

${doc(facts, "tooltipName")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(
  { ${labelClass}, ...props },
  forwardedRef,
) {
  const content = ${n.useContent}();
  const context = ${n.useRow}();
  if (!content || !context) return null;
  return (
    <${facts.parts.tooltipName.element} {...props} ref={forwardedRef} data-slot="${slot(facts, "tooltipName")}">
      {context.nestHeading ? (
        <span className={${labelClass}} data-slot="${slot(facts, "tooltipLabel")}">
          {content.heading}
        </span>
      ) : null}
      {context.nestHeading ? " " : null}
      {context.row.name as React.ReactNode}
    </${facts.parts.tooltipName.element}>
  );
});

${displayName(facts, "tooltipName")}

export default ${name};
`;
}

function printTooltipValue(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.tooltipValue.exportName;
  return `import * as React from "react";
${itemsImport(facts, [n.useRow])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "tooltipValue")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(props, forwardedRef) {
  const context = ${n.useRow}();
  if (!context) return null;
  return (
    <${facts.parts.tooltipValue.element} {...props} ref={forwardedRef} data-slot="${slot(facts, "tooltipValue")}">
      {context.row.value as React.ReactNode}
    </${facts.parts.tooltipValue.element}>
  );
});

${displayName(facts, "tooltipValue")}

export default ${name};
`;
}

function printLegend(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legend.exportName;
  return `import * as React from "react";

export interface ${n.legendState} {
  hideIcon: boolean;
}

export const ${n.legendContext} = React.createContext<${n.legendState}>({ hideIcon: ${chartPropDefault(facts, "legend", "hideIcon")} });

export function ${n.useLegend}(): ${n.legendState} {
  return React.useContext(${n.legendContext});
}

export type ${name}Props = React.HTMLAttributes<HTMLDivElement> & {
${propFields(facts, "legend")}
};

${doc(facts, "legend")}
const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(function ${name}(
  { hideIcon = ${chartPropDefault(facts, "legend", "hideIcon")}, "aria-label": ariaLabel = "${facts.defaults.legendAriaLabel}", children, ...props },
  forwardedRef,
) {
  const value = React.useMemo(() => ({ hideIcon }), [hideIcon]);
  return (
    <${n.legendContext}.Provider value={value}>
      <${facts.parts.legend.element}
        role="group"
        aria-label={ariaLabel}
        {...props}
        ref={forwardedRef}
        data-slot="${slot(facts, "legend")}"
      >
        {children}
      </${facts.parts.legend.element}>
    </${n.legendContext}.Provider>
  );
});

${displayName(facts, "legend")}

export default ${name};
`;
}

function printLegendItems(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legendItems.exportName;
  return `import * as React from "react";
${rootImport(facts, [n.useInternalRoot])}

export const ${n.keyContext} = React.createContext<string | null>(null);

export function ${n.useKey}(): string | null {
  return React.useContext(${n.keyContext});
}

export type ${name}Props = {
${propFields(facts, "legendItems")}
};

${doc(facts, "legendItems")}
function ${name}({ children }: ${name}Props) {
  const { legendKeys } = ${n.useInternalRoot}();
  return (
    <>
      {legendKeys.map((key) => (
        <${n.keyContext}.Provider key={key} value={key}>
          {children}
        </${n.keyContext}.Provider>
      ))}
    </>
  );
}

${displayName(facts, "legendItems")}

export default ${name};
`;
}

function legendItemsImport(facts: ChartSurfaceFacts, members: string[]): string {
  return `import { ${members.join(", ")} } from "./${facts.parts.legendItems.exportName}";`;
}

function printLegendItem(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legendItem.exportName;
  const h = facts.runtime.helpers;
  return `import { ${h.configText} } from "${facts.runtime.importSource}";
import * as React from "react";
${rootImport(facts, [n.useRoot])}
${legendItemsImport(facts, [n.keyContext, n.useKey])}

export type ${name}Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "value"> & {
${propFields(facts, "legendItem")}
};

${doc(facts, "legendItem")}
const ${name} = React.forwardRef<HTMLElement, ${name}Props>(function ${name}(
  { value: valueProp, interactive, onClick, children, ...props },
  forwardedRef,
) {
  const root = ${n.useRoot}();
  const contextKey = ${n.useKey}();
  const key = valueProp ?? contextKey;
  if (key == null) throw new Error(${JSON.stringify(chartLegendKeyMessage(facts))});
  const entry = root.config[key];
  const rich = entry?.label;
  const plain = rich == null || typeof rich === "string" || typeof rich === "number";
  const ariaLabel = props["aria-label"] ?? (plain ? undefined : ${h.configText}(entry, key));
  const on = root.visible.includes(key);
  const inner = <${n.keyContext}.Provider value={key}>{children}</${n.keyContext}.Provider>;

  if (!(interactive ?? root.mode === "source")) {
    return (
      <span
        ref={forwardedRef as React.Ref<HTMLSpanElement>}
        id={props.id}
        className={props.className}
        style={props.style}
        title={props.title}
        aria-label={ariaLabel}
        data-key={key}
        data-slot="${slot(facts, "legendItem")}"
      >
        {inner}
      </span>
    );
  }

  return (
    <${facts.parts.legendItem.element}
      {...props}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={on}
      data-state={on ? "on" : "off"}
      data-key={key}
      data-slot="${slot(facts, "legendItem")}"
      onClick={(event) => {
        ${chartLegendToggle("onClick?.(event);", "event.nativeEvent", "event.currentTarget")}
      }}
    >
      {inner}
    </${facts.parts.legendItem.element}>
  );
});

${displayName(facts, "legendItem")}

export default ${name};
`;
}

function printLegendSwatch(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legendSwatch.exportName;
  return `import * as React from "react";
${rootImport(facts, [n.useRoot])}
${legendItemsImport(facts, [n.useKey])}
import { ${n.useLegend} } from "./${facts.parts.legend.exportName}";

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "legendSwatch")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(
  { style, ...props },
  forwardedRef,
) {
  const root = ${n.useRoot}();
  const key = ${n.useKey}();
  const { hideIcon } = ${n.useLegend}();
  if (key == null || (root.config[key]?.icon && !hideIcon)) return null;
  return (
    <${facts.parts.legendSwatch.element}
      {...props}
      ref={forwardedRef}
      style={{ background: \`var(${facts.attrs.seriesColorVariablePrefix}\${key})\`, ...style }}
      data-slot="${slot(facts, "legendSwatch")}"
      aria-hidden="true"
    />
  );
});

${displayName(facts, "legendSwatch")}

export default ${name};
`;
}

function printLegendIcon(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legendIcon.exportName;
  return `import * as React from "react";
${rootImport(facts, [n.icon, n.useRoot])}
${legendItemsImport(facts, [n.useKey])}
import { ${n.useLegend} } from "./${facts.parts.legend.exportName}";

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "legendIcon")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(
  { style, ...props },
  forwardedRef,
) {
  const root = ${n.useRoot}();
  const key = ${n.useKey}();
  const { hideIcon } = ${n.useLegend}();
  const icon = key == null ? undefined : root.config[key]?.icon;
  if (key == null || !icon || hideIcon) return null;
  return (
    <${facts.parts.legendIcon.element}
      {...props}
      ref={forwardedRef}
      style={{ color: \`var(${facts.attrs.seriesColorVariablePrefix}\${key})\`, ...style }}
      data-slot="${slot(facts, "legendIcon")}"
      aria-hidden="true"
    >
      <${n.icon} icon={icon} />
    </${facts.parts.legendIcon.element}>
  );
});

${displayName(facts, "legendIcon")}

export default ${name};
`;
}

function printLegendLabel(facts: ChartSurfaceFacts): string {
  const n = names(facts);
  const name = facts.parts.legendLabel.exportName;
  return `import * as React from "react";
${rootImport(facts, [n.useRoot])}
${legendItemsImport(facts, [n.useKey])}

export type ${name}Props = Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

${doc(facts, "legendLabel")}
const ${name} = React.forwardRef<HTMLSpanElement, ${name}Props>(function ${name}(props, forwardedRef) {
  const root = ${n.useRoot}();
  const key = ${n.useKey}();
  if (key == null) return null;
  const rich = root.config[key]?.label;
  const plain = rich == null || typeof rich === "string" || typeof rich === "number";
  return (
    <${facts.parts.legendLabel.element} {...props} ref={forwardedRef} data-slot="${slot(facts, "legendLabel")}">
      {plain ? root.label(key) : (rich as React.ReactNode)}
    </${facts.parts.legendLabel.element}>
  );
});

${displayName(facts, "legendLabel")}

export default ${name};
`;
}
