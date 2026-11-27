import { type ChartOperations, closureChartOperations } from "../../shared-recipes/chart/recipe.js";
import type { ChartSurfaceFacts } from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import { vueFrameworkOperations as fw } from "./recipe-framework-operations.js";

/**
 * Vue syntax for the chart recipe. Setup runs once, computed refs follow their inputs, a watch
 * delivers parent commands, and DOM work waits for the post flush.
 */
export function vueChartOperations({ visibility: v }: ChartSurfaceFacts): ChartOperations {
  const model = v.controlledProp;
  const listener = `${v.callbackProp[2]!.toLowerCase()}${v.callbackProp.slice(3)}`;
  return {
    ...closureChartOperations,
    fw,
    derive: (name, expression, { type } = {}) =>
      `const ${name} = computed${type ? `<${type}>` : ""}(() => (${expression}));`,
    read: (name) => `${name}.value`,
    prop: (name) => `props.${name}`,
    raw: (value) => `toRaw(${value})`,
    snapshot: (value) => `toRaw(${value})`,
    datum: "unknown",
    model: fw.readModel(model),
    mode: "mode.value",
    ownership: `const controlled = ${fw.controlled(model)};`,
    controlled: "controlled",
    acceptedCell: (initial) => fw.acceptedCell(model, "readonly string[] | undefined", initial),
    accepted: `uncontrolled${model[0]!.toUpperCase()}${model.slice(1)}.value`,
    render: (value) => fw.renderAccepted(model, value),
    visibleName: "visible",
    // The getter copies the array, so the watch also sees a parent that changes items in place.
    observeCommand: (body) =>
      `watch(\n() => (props.${model} ? [...props.${model}] : undefined),\n(incoming) => {\n${body("incoming")}\n},\n);`,
    publish: (value) => fw.publishModel(model, `copyModel(${value})`),
    proposal: (value, details) => fw.proposal(v.callbackProp, value, details),
    tooltipCell: (entry) => `const tooltips = shallowRef<readonly ${entry}[]>(EMPTY);`,
    tooltips: "tooltips.value",
    firstTooltip: "tooltips.value[0] ?? null",
    setTooltips: (next) => `tooltips.value = ${next("tooltips.value")};`,
    specCell: "const specParts = shallowRef<readonly ChartSpecEntry[]>(EMPTY);",
    specParts: "specParts.value",
    setSpecParts: (next) => `specParts.value = ${next("specParts.value")};`,
    ariaLabel: "props.ariaLabel",
    // Parts register in setup. On the server the Surface draws after the sibling parts set up.
    seed: "spec.value",
    // Parts register in setup, before the Surface starts after mount.
    settled: "true",
    // A part registers in setup, after an earlier legend renders. Until the Root mounts, the legend
    // reads the mark parts among the slot vnodes with the parts that registered so far, on the
    // server and in hydration alike.
    legendSpec: "legendMounted.value ? spec.value : mergeChartLegendSeed(legendSeed, spec.value)",
    // A declared emit is not a prop, so the guard reads the listeners from the vnode in every
    // compiled spelling.
    listenerDefined: "hasVisibilityListener(instance?.vnode.props)",
    visibilityNames: `v-model:${model}, ${v.defaultProp}, and the ${listener} and update:${model} listeners`,
    guard: (body) =>
      `const instance = getCurrentInstance();\nconst assertVisibility = () => {\n${body}\n};\nassertVisibility();`,
    element: "element.value",
    applied: "applied",
    content: "content.value",
    bodyCell: "const body = shallowRef<ChartTooltipBody | null>(null);",
    body: "body.value",
    setBody: (value) => `body.value = ${value};`,
    restart: (key) =>
      `onMounted(start);\nonBeforeUnmount(stop);\nwatch(\n() => ${key},\n() => {\nif (!controller) return;\nstop();\nstart();\n},\n{ flush: "post" },\n);`,
    observe: `watch(read, sync, { flush: "post" });`,
  };
}
