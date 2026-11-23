import { type ChartOperations, closureChartOperations } from "../../shared-recipes/chart/recipe.js";
import type { ChartSurfaceFacts } from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import { svelteFrameworkOperations, svelteTrackModel } from "./recipe-framework-operations.js";

/** Untracked blocks open on their own line, so the printer can nest their bodies. */
const fw = {
  ...svelteFrameworkOperations,
  untracked: (body: string) => `untrack(() => {\n${body}\n});`,
};

/**
 * Svelte syntax for the chart recipe. The script runs once, runes derive values, a pre-effect
 * reads commands, and effects run their work untracked.
 */
export function svelteChartOperations({ visibility: v }: ChartSurfaceFacts): ChartOperations {
  const model = v.controlledProp;
  return {
    ...closureChartOperations,
    fw,
    derive: (name, expression, { type } = {}) =>
      `const ${name} = $derived${type ? `<${type}>` : ""}(${expression});`,
    read: (name) => name,
    prop: (name) => name,
    raw: (value) => value,
    snapshot: (value) => `$state.snapshot(${value})`,
    datum: "T",
    model: fw.readModel(model),
    mode: "mode",
    ownership: fw.controlledCell(model),
    controlled: fw.controlled(model),
    acceptedCell: (initial) =>
      fw.acceptedCell(model, "readonly string[] | undefined", `untrack(() => ${initial})`),
    accepted: `rendered${model[0]!.toUpperCase()}${model.slice(1)}`,
    render: (value) => fw.renderAccepted(model, value),
    visibleName: "current",
    memory: (name, initial) => `let ${name} = untrack(() => ${initial});`,
    observeCommand: (body) =>
      `$effect.pre(() => {\n${svelteTrackModel(model)}\n${fw.untracked(`const incoming = ${fw.readModel(model)};\n${body("incoming")}`)}\n});`,
    publish: (value) => fw.publishModel(model, value, true),
    proposal: (value, details) => fw.proposal(v.callbackProp, value, details),
    tooltipCell: (entry) => `let tooltips = $state.raw<readonly ${entry}[]>(EMPTY);`,
    tooltips: "tooltips",
    firstTooltip: "tooltips[0] ?? null",
    setTooltips: (next) => `tooltips = ${next("tooltips")};`,
    mounted: (body) => `onMount(() => {\n${body("current")}\n});`,
    listenerDefined: `${v.callbackProp} !== undefined`,
    visibilityNames: `bind:${model}, ${v.defaultProp} and ${v.callbackProp}`,
    // A later definition prop also fails, so the guard runs again before each update.
    guard: (body) =>
      `const assertVisibility = () => {\n${body}\n};\nuntrack(assertVisibility);\n$effect.pre(assertVisibility);`,
    element: "element",
    applied: "applied",
    content: "resolved",
    bodyCell: "let body = $state.raw<ChartTooltipBody | null>(null);",
    body: "body",
    setBody: (value) => `body = ${value};`,
    restart: (key) =>
      `$effect(() => {\nvoid ${key};\nuntrack(start);\nreturn () => untrack(stop);\n});`,
    observe: "$effect(() => {\nconst next = read();\nuntrack(() => sync(next));\n});",
  };
}
