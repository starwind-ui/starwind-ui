import type { ChartSurfaceFacts } from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import type { FrameworkOperations } from "../structured/operations.js";

/**
 * Generation-only chart recipe. The Surface creates the Runtime controller and hands it to the
 * Root with `attachController`, so the Root owns the visible model without a factory call. The
 * recipe owns these rules:
 * - ADR 0011 and the contract `ownership` fact: the Root fixes the owner at mount. A defined
 *   initial model is parent-controlled until unmount, a later undefined value keeps the keys, and
 *   a later defined value on a Runtime-owned model is a silent command (`laterDefined`).
 * - ADR 0015: the Runtime calls the proposal callback and dispatches the cancelable event before
 *   it commits. The Root publishes only from the accepted subscription and skips canceled details.
 * - ADR 0018: a parent-controlled binding writes the proposal once and then reads the parent
 *   getter back. A local write on a one-way bindable stays stale until the parent changes it.
 *   Arrays cross the model boundary as copies.
 */
export interface ChartOperations {
  fw: FrameworkOperations;
  /** Declares a value that follows its inputs. `deps` and `type` are optional syntax hints. */
  derive(name: string, expression: string, hints?: { deps?: string[]; type?: string }): string;
  read(name: string): string;
  prop(name: string): string;
  /** A function that keeps its identity across renders. */
  callback(params: string, body: string, deps?: string[]): string;
  /** `raw` and `snapshot` give plain values to the Runtime. `datum` types a data row. */
  raw(value: string): string;
  snapshot(value: string): string;
  datum: string;
  /** The parent's model input, and the mode that a callback reads. */
  model: string;
  mode: string;
  /** Fixes ownership at mount. `controlled` reads the result. */
  ownership: string;
  controlled: string;
  /** Declares the accepted mirror. `accepted` reads it and `render` writes it. */
  acceptedCell(initial: string): string;
  accepted: string;
  render(value: string): string;
  visibleName: string;
  /** Adapter memory that only the adapter reads. */
  memory(name: string, initial: string): string;
  write(name: string, value: string): string;
  /** Runs `body` for each parent model input. */
  observeCommand(body: (incoming: string) => string): string;
  /** Publishes keys to the parent model. A target without it publishes through the callback. */
  publish?(value: string): string;
  proposal(value: string, details: string): string;
  controllerCell: string;
  controller: string;
  /** Runs after mount with the rendered visible keys. A binding target publishes there. */
  mounted?(body: (visible: string) => string): string;
  /** Declares the Tooltip registrations, reads them and replaces them from the current list. */
  tooltipCell(entry: string): string;
  tooltips: string;
  firstTooltip: string;
  setTooltips(next: (list: string) => string): string;
  /** Declares the Root state from `[field, value]` pairs. `methods` name the function fields. */
  stateObject(name: string, type: string, fields: [string, string][], methods: Set<string>): string;
  /** The definition guard: the defined-listener check, the public names and the placement. */
  listenerDefined: string;
  visibilityNames: string;
  guard(body: string): string;
  /** Surface cells: the element, the applied settings, the resolved content and the body. */
  element: string;
  applied: string;
  content: string;
  bodyCell: string;
  body: string;
  setBody(value: string): string;
  /** Starts the controller on mount and restarts it when `key` changes. */
  restart(key: string): string;
  /** Calls `sync(read())` after each change of the settings. */
  observe: string;
}

/** Plain closure syntax for targets whose component setup runs once. */
export const closureChartOperations = {
  memory: (name: string, initial: string) => `let ${name} = ${initial};`,
  write: (name: string, value: string) => `${name} = ${value};`,
  controllerCell: "let controller: ChartController<any, any, any, any> | null = null;",
  controller: "controller",
  callback: (params: string, body: string) => `(${params}) => {\n${body}\n}`,
  /** Getters read framework state, so every read of a field tracks it. */
  stateObject: (name: string, type: string, fields: [string, string][], methods: Set<string>) =>
    `const ${name}: ${type} = {\n${fields
      .map(([key, value]) =>
        methods.has(key)
          ? key === value
            ? key
            : `${key}: ${value}`
          : `get ${key}() {\nreturn ${value};\n}`,
      )
      .join(",\n")},\n};`,
};

const KEYS = "readonly string[] | undefined";

export const chartModelHelpers = `function copyModel(value: readonly string[]): string[];
function copyModel(value: ${KEYS}): string[] | undefined;
function copyModel(value: ${KEYS}): string[] | undefined {
  return value === undefined ? undefined : [...value];
}
function isModelEqual(left: ${KEYS}, right: ${KEYS}): boolean {
  return (
    left === right ||
    (!!left && !!right && left.length === right.length && left.every((key, index) => key === right[index]))
  );
}`;

/** A static native definition owns its visibility, so it rejects the visibility props. */
export function chartDefinitionGuard(ops: ChartOperations, facts: ChartSurfaceFacts): string {
  const defaultModel = ops.prop(facts.visibility.defaultProp);
  return ops.guard(`if (${ops.read("mode")} === "definition" && (${ops.model} !== undefined || ${defaultModel} !== undefined || ${ops.listenerDefined})) {
  throw new TypeError(
    "Static native definitions own their visibility. Remove ${ops.visibilityNames}, or use a chart factory.",
  );
}`);
}

/** The Root's visible model: fixed ownership, the accepted mirror and parent commands. */
export function chartVisibleModel(ops: ChartOperations, facts: ChartSurfaceFacts): string {
  const binding = ops.fw.modelAuthority === "runtime-binding";
  const record = (incoming: string) => ops.write("lastCommand", `copyModel(${incoming})`);
  const apply = (incoming: string) => `${record(incoming)}
if (${incoming} !== undefined${binding ? ` && !isModelEqual(${ops.accepted}, ${incoming})` : ""}) ${ops.render(`copyModel(${incoming})`)}`;
  const command = (incoming: string) =>
    binding
      ? `// A local write on a one-way prop hides a stale parent value until the parent changes it.
if (${ops.controlled} || isModelEqual(${ops.fw.readInput(facts.visibility.controlledProp)}, ${incoming})) applyCommand(${incoming});
else ${record(incoming)}`
      : apply(incoming);
  return `// Accepted model (contract \`ownership\`, ADR 0011 and ADR 0018). The Root chooses the owner
// once, when it mounts: a defined \`${facts.visibility.controlledProp}\` makes the model parent-controlled, and an
// undefined one leaves it to the Runtime. The mirror holds the keys that the Runtime controller
// accepted, or the parent's keys. The legend and the server render read it before the controller
// exists.
${ops.ownership}
${ops.acceptedCell(`copyModel(${ops.model} ?? ${ops.prop(facts.visibility.defaultProp)})`)}
// A copy of the last incoming parent value. Commands compare by contents, so a later value
// that differs is a silent command, and an unchanged value never reverts an accepted toggle.
// Later undefined keeps the keys.
${ops.memory("lastCommand", `copyModel(${ops.model})`)}
${binding ? `const applyCommand = (incoming: ${KEYS}) => {\n${apply("incoming")}\n};\n` : ""}${ops.observeCommand(
    (incoming) => `if (!isModelEqual(${incoming}, lastCommand)) {\n${command(incoming)}\n}`,
  )}`;
}

/** The Root's derived keys and chart input. */
export function chartRootInputs(ops: ChartOperations, facts: ChartSurfaceFacts): string {
  const [data, params, theme] = ["data", "params", "theme"].map(ops.prop) as [
    string,
    string,
    string,
  ];
  const config = ops.read("config");
  const field = (key: string, value: string) => (key === value ? key : `${key}: ${value}`);
  return `// A plain snapshot, so the Runtime never stores a framework proxy.
${ops.derive("requested", `${ops.read("mode")} === "definition" ? undefined : ${ops.snapshot(ops.accepted)}`)}
${ops.derive(ops.visibleName, `${facts.runtime.helpers.visibleKeys}(${config}, ${ops.read("requested")})`, { deps: [config, "requested"] })}
${ops.derive("keys", `Object.keys(${config})`, { deps: [config] })}
// The visible keys stay out of the input, so an accepted toggle does not come back through the
// controller's \`update\` and render the chart a second time.
${ops.derive(
  "input",
  `{
  data: (${ops.raw(data)} ?? EMPTY) as readonly ${ops.datum}[],
  ${field("config", config)},
  ...(${params} ? { ${field("params", ops.raw(params))} } : {}),
  ...(${theme} ? { ${field("theme", ops.raw(theme))} } : {}),
}`,
  { deps: [data, config, params, theme], type: `ChartInput<${ops.datum}>` },
)}`;
}

/** Visibility requests, the proposal callback and the accepted subscription of the Root. */
export function chartVisibleRequests(ops: ChartOperations, facts: ChartSurfaceFacts): string {
  const { fw, publish } = ops;
  const binding = fw.modelAuthority === "runtime-binding";
  const owned = `// Read the keys from the controller, because a silent write in a callback can replace the
// proposal. The copy keeps the mirror apart from the Runtime array.
${ops.render("next.getVisible()")}`;
  const accepted = publish
    ? `if (${ops.controlled}) {
${publish("details.visible")}${
        binding
          ? `
// A binding target reads the parent getter back after a parent-controlled publication, so a
// setter that transforms or refuses the proposal decides the keys.
const readback = ${fw.readModel(facts.visibility.controlledProp)};
if (readback !== undefined) applyCommand(readback);`
          : ""
      }
return;
}
${owned}
${publish(ops.accepted)}`
    : `if (!${ops.controlled}) {\n${owned}\n}`;
  const request = (call: string) => `if (${ops.mode} === "source") ${ops.controller}?.${call};`;
  return `${ops.controllerCell}
// The Runtime callback runs before the cancelable \`${facts.visibility.domEvent}\` event, so a
// consumer can cancel the proposal with \`details.cancel()\`.
const proposeVisible = ${ops.callback("next: string[], details: ChartVisibleChangeDetails", fw.untracked(ops.proposal("next", "details")))};
const setVisible = ${ops.callback("next: readonly string[]", request("setVisible(next)"))};
const toggle = ${ops.callback("key: string, options?: ChartToggleOptions", request("toggle(key, options)"))};
const attachController = ${ops.callback(
    "next: ChartController<any, any, any, any> | null",
    `${ops.controller} = next;
// The model follows the accepted change, after the cancelable event. A parent-controlled
// model gets the proposal once, and the parent then supplies the keys.
next?.subscribe("visibleChange", (details) => {
  if (${ops.controller} !== next || details.isCanceled) return;
  ${fw.untracked(accepted)}
});`,
    [ops.controlled],
  )};${
    binding && ops.mounted && publish
      ? `
// A Runtime-owned model publishes its accepted keys to the binding once the chart mounts.
${ops.mounted((visible) => `if (${ops.mode} === "source" && !${ops.controlled}) {\n${publish(visible)}\n}`)}`
      : ""
  }`;
}

/**
 * The public Root state fields. A custom legend or style part reads only these, so they are the
 * fields that \`useChartRoot()\` returns. Every other field is adapter plumbing.
 */
export const CHART_PUBLIC_STATE_FIELDS = [
  "id",
  "mode",
  "config",
  "keys",
  "visible",
  "label",
  "setVisible",
  "toggle",
] as const;

/**
 * The Root state types. \`state\` is the public state that \`useChartRoot()\` returns. \`internal\`
 * extends it with the plumbing that the Surface and the Tooltip parts read, and it stays out of
 * the package index. The public fields are read-only in every target. Getter targets also mark
 * the internal data fields \`readonly\`, because each getter reads framework state.
 */
export function chartRootState(
  state: string,
  internal: string,
  entry: string,
  readonly: boolean,
): string {
  const ro = readonly ? "readonly " : "";
  // The public state is read-only in every target. A custom legend requests changes through
  // \`setVisible\` and \`toggle\`, and it cannot change the arrays that the built-in parts read.
  return `export interface ${state} {
  readonly id: string;
  /** "source" uses a chart module or factory. "definition" uses a static native definition. */
  readonly mode: "source" | "definition";
  readonly config: ChartConfig;
  /** Every config key, in config order. */
  readonly keys: readonly string[];
  /**
   * The rendered visible config keys, in config order: a mirror of the keys that the Runtime
   * controller accepted, or of the parent's keys when the model is parent-controlled.
   */
  readonly visible: readonly string[];
  /** Plain text for a config key. Rich labels use \`config[key].text\`. */
  readonly label: (key: string) => string;
  /** Requests new visible keys through the Runtime controller. */
  readonly setVisible: (next: readonly string[]) => void;
  /** Requests a toggle of one config key through the Runtime controller. */
  readonly toggle: (key: string, options?: ChartToggleOptions) => void;
}

/** Adapter plumbing that the Surface and the Tooltip parts read. It is not public. */
export interface ${internal} extends ${state} {
  ${ro}chart: ChartSource<any, any, any, any> | undefined;
  ${ro}definition: ChartDefinition<any, any, any> | undefined;
  /** Chart input without \`visible\`. The Surface sends the visible keys to the controller. */
  ${ro}input: ChartInput<any>;
  ${ro}host: NativeHostOptions<any, any, any> | undefined;
  ${ro}disableTooltip: boolean;
  /**
   * The raw visible keys behind \`visible\`. \`undefined\` means every config key, including keys
   * added later.
   */
  ${ro}visibleModel: readonly string[] | undefined;
  /** True when a defined initial \`visible\` made the model parent-controlled. */
  ${ro}controlled: boolean;
  /** The Runtime controller's \`onVisibleChange\`. It sends the proposal to the consumer. */
  proposeVisible(visible: string[], details: ChartVisibleChangeDetails): void;
  /** Connects the Surface's controller. The root mirrors the keys that the controller accepts. */
  attachController(controller: ChartController<any, any, any, any> | null): void;
  /** The first Tooltip registration, or \`null\`. */
  ${ro}tooltip: ${entry} | null;
  registerTooltip(entry: ${entry}): () => void;
}`;
}

export const chartSurfaceHelpers = `type ChartSurfaceSettings = {
  chart: unknown;
  definition: unknown;
  host: object | undefined;
  disableTooltip: boolean;
  bodyHandler: ((target: ChartTooltipBody | null) => void) | undefined;
  input: ChartInput<any>;
  visible: readonly string[];
};

function shallowEqual(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) =>
    Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}`;

/** The first render shows the prerendered SVG. A source chart renders the Root's visible keys. */
export function chartPrerender(facts: ChartSurfaceFacts): string {
  return `${facts.runtime.helpers.prerender}(
  root.chart,
  root.mode === "source" ? { ...root.input, visible: root.visible } : root.input,
  {
    id: root.id,
    host: root.host,
    definition: root.definition,
    tooltipDisabled: root.disableTooltip,
  },
)`;
}

/**
 * The tooltip body target. The Runtime hands a body target only while tooltip content exists, and
 * the portal renders into it only then.
 */
export function chartTooltipBody(ops: ChartOperations): string {
  return `${ops.derive("hasBody", `${ops.content} !== null`)}
${ops.bodyCell}
const onTooltipBodyChange = ${ops.callback("target: ChartTooltipBody | null", ops.setBody("target"), [])};
${ops.derive("portalBody", `${ops.read("hasBody")} ? ${ops.body} : null`)}`;
}

/** Keeps the native status label in step with the rendered body text. */
export function chartTooltipAccessibility(facts: ChartSurfaceFacts, target: string): string {
  return `if (${target}) ${facts.runtime.helpers.syncTooltipAccessibility}(${target}.element, ${target});`;
}

/**
 * The Surface lifecycle. Only the chart id restarts the controller, because the controller reads
 * it when it starts. Other settings change through `setOptions` and one `update`.
 */
export function chartSurfaceLifecycle(ops: ChartOperations, facts: ChartSurfaceFacts): string {
  const { controller, applied } = ops;
  return `const read = (): ChartSurfaceSettings => ({
  chart: root.chart,
  definition: root.definition,
  host: root.host,
  disableTooltip: root.disableTooltip,
  bodyHandler: ${ops.read("hasBody")} ? onTooltipBodyChange : undefined,
  input: root.input,
  visible: root.visible,
});
const chartRootElement = () => ${ops.element}?.closest<HTMLElement>("[${facts.attrs.chartId}]") ?? null;
const start = () => {
  const chartRoot = chartRootElement();
  if (!${ops.element} || !chartRoot) return;
  const settings = read();
  ${applied} = settings;
  ${controller} = ${facts.runtime.factory}(chartRoot, {
    chart: root.chart,
    definition: root.definition,
    input: root.input,
    host: root.host,
    tooltipDisabled: settings.disableTooltip,
    onTooltipBodyChange: settings.bodyHandler,
    // A new controller starts from the Root's current keys, so a restart keeps a toggle. The raw
    // value keeps \`undefined\` as every key, so a key added later to the config shows. The
    // controller detects a controlled model from the presence of \`visible\`, and the owner stays
    // the one that the Root chose when it mounted.
    ...(root.controlled ? { visible: root.visibleModel } : { defaultVisible: root.visibleModel }),
    onVisibleChange: root.proposeVisible,
  });
  root.attachController(${controller});
};
// Only a Surface that started a controller detaches it. A Surface outside the chart element, as in
// a portal, never started one, so its cleanup leaves the working Surface attached.
const stop = () => {
  const current = ${controller};
  if (!current) return;
  ${controller} = null;
  ${applied} = null;
  root.attachController(null);
  current.destroy();
  ${ops.setBody("null")}
};
const sync = (next: ChartSurfaceSettings) => {
  const owned = ${controller};
  const previous = ${applied};
  if (!owned || !previous) return;
  ${applied} = next;
  const optionsChanged =
    previous.chart !== next.chart ||
    previous.definition !== next.definition ||
    previous.disableTooltip !== next.disableTooltip ||
    previous.bodyHandler !== next.bodyHandler ||
    !shallowEqual(previous.host, next.host);
  if (optionsChanged) {
    if (!next.bodyHandler) ${ops.setBody("null")}
    owned.setOptions({
      chart: root.chart,
      definition: root.definition,
      host: root.host,
      tooltipDisabled: next.disableTooltip,
      onTooltipBodyChange: next.bodyHandler,
    });
  }
  const inputChanged = previous.input !== next.input;
  // The Root's keys change after a parent \`${facts.visibility.controlledProp}\` command. After an accepted toggle
  // they already match the controller, so nothing renders again. One \`update\` carries new input
  // and new keys together, so the chart renders once.
  const keysChanged =
    root.mode === "source" &&
    !sameKeys(${facts.runtime.helpers.visibleKeys}(next.input.config, owned.getInput().visible), next.visible);
  if (keysChanged)
    owned.update(inputChanged ? { ...next.input, visible: root.visibleModel } : { visible: root.visibleModel });
  else if (inputChanged) owned.update(next.input);
};
// The controller reads the chart id when it starts, so a new id restarts it.
${ops.restart("root.id")}
${ops.observe}`;
}

/** Tooltip registrations in mount order. The first registration supplies the tooltip body. */
export function chartTooltipRegistry(ops: ChartOperations, entry: string): string {
  const remove = ops.setTooltips((list) => `${list}.filter((candidate) => candidate !== entry)`);
  return `// Tooltip registrations in mount order. The first one supplies the tooltip body.
${ops.tooltipCell(entry)}
const registerTooltip = ${ops.callback(`entry: ${entry}`, `${ops.setTooltips((list) => `[...${list}, entry]`)}\nreturn () => {\n${remove}\n};`)};`;
}

export const chartFirstTooltip = (ops: ChartOperations) => `${ops.tooltips}[0] ?? null`;

/** One tooltip candidate. `bind` reads its input just before the check, after earlier steps. */
export type ChartTooltipStep = { bind?: [string, string]; when: string; value: string };
const TOOLTIP_ORDER = ["native", "explicit", "registered", "fallback"] as const;

/** The Surface tooltip order: native body, explicit content, first registered Tooltip, fallback. */
export function chartTooltipResolution(
  steps: Record<(typeof TOOLTIP_ORDER)[number], ChartTooltipStep[]>,
): string {
  const step = ({ bind, when, value }: ChartTooltipStep) =>
    `${bind ? `const ${bind[0]} = ${bind[1]};\n` : ""}if (${when}) return ${value};`;
  return [...TOOLTIP_ORDER.flatMap((slot) => steps[slot].map(step)), "return null;"].join("\n");
}

/**
 * A legend item toggles its key itself. Consumer handlers run first, and one that calls
 * `preventDefault()` cancels the toggle.
 */
export function chartLegendToggle(run: string, event: string, trigger: string): string {
  return `// Consumer handlers run first. One that calls preventDefault() cancels the toggle.
${run}
if (!event.defaultPrevented) root.toggle(key, { event: ${event}, trigger: ${trigger} });`;
}

const STATE_METHODS = new Set([
  "label",
  "setVisible",
  "toggle",
  "proposeVisible",
  "attachController",
  "registerTooltip",
]);

/**
 * The Root state values: the internal state that the parts read, and the public state with only
 * the public fields. Each field reads the Root's current input, accepted keys or request.
 */
export function chartRootStateValue(
  ops: ChartOperations,
  facts: ChartSurfaceFacts,
  internal: { name: string; type: string },
  state: { name: string; type: string },
): string {
  const cast = (name: string, as: string) => `${ops.raw(ops.prop(name))} as ${as} | undefined`;
  const fields: [string, string][] = [
    ["id", ops.read("id")],
    ["mode", ops.read("mode")],
    ["chart", cast("chart", "ChartSource<any, any, any, any>")],
    ["definition", cast("definition", "ChartDefinition<any, any, any>")],
    ["input", ops.read("input")],
    ["config", ops.read("config")],
    ["host", cast("host", "NativeHostOptions<any, any, any>")],
    ["disableTooltip", ops.prop("disableTooltip")],
    ["keys", ops.read("keys")],
    ["visible", ops.read(ops.visibleName)],
    ["visibleModel", ops.read("requested")],
    ["controlled", ops.controlled],
    ...[...STATE_METHODS].slice(0, 5).map((name): [string, string] => [name, name]),
    ["tooltip", ops.firstTooltip],
    ["registerTooltip", "registerTooltip"],
  ];
  const isPublic = new Set<string>(CHART_PUBLIC_STATE_FIELDS);
  return `const label = ${ops.callback("key: string", `return ${facts.runtime.helpers.configText}(${ops.read("config")}[key], key);`, [ops.read("config")])};
${ops.stateObject(internal.name, internal.type, fields, STATE_METHODS)}
// The public state holds only the public fields, so \`use${facts.parts.root.exportName}()\` returns no plumbing.
${ops.stateObject(
  state.name,
  state.type,
  fields.filter(([key]) => isPublic.has(key)),
  STATE_METHODS,
)}`;
}

/**
 * The tooltip content options that the Runtime `tooltipLayout` helper reads, from the contract
 * props of the TooltipContent part. `read` gives the target's expression for one prop.
 */
export function chartTooltipLayoutOptions(
  facts: ChartSurfaceFacts,
  target: "react" | "vue" | "svelte",
  read: (name: string) => string = (name) => name,
): string {
  const names = facts.parts.tooltipContent.props
    .filter((prop) => prop.kind !== "children" && !prop.unsupportedTargets?.includes(target))
    .map((prop) => prop.name);
  return `{ ${names.map((name) => (read(name) === name ? name : `${name}: ${read(name)}`)).join(", ")} }`;
}
