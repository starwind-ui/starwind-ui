import { reactTimedRoot } from "../../../framework-adapters/react/timed-recipe.js";
import { svelteTimedRoot } from "../../../framework-adapters/svelte/timed-recipe.js";
import type { AdapterTimedFloatingOverlayFacts as Facts } from "../../../framework-adapters/types.js";
import { vueTimedRoot } from "../../../framework-adapters/vue/timed-recipe.js";
import { emitConnectionType, emitLifecycle } from "../emit.js";
import { operations, type Target } from "../operations.js";
import { authoredPlacementStorage, connectPopoverSurface } from "../popover-surface.js";
import { type TimedRecipe, timedRecipe } from "./recipe.js";
export type TimedRootInput = {
  facts: Facts;
  plan: TimedRecipe;
  props: { name: string; type: string; defaultValue?: string }[];
  fields: string;
  initial: string;
  accepted: string;
  controller: string;
  lifecycle: string;
  attributes: string;
  placement: string;
  connectSurface: string;
  disabledSync: string;
  observeModel: string;
};
export interface TimedRootProjection {
  read(name: string): string;
  initial(expression: string): string;
  attribute(name: string, value?: string): string;
  observe(inputs: readonly string[], body: string): string;
  print(input: TimedRootInput): string;
}
const projections: Record<Target, TimedRootProjection> = {
  react: reactTimedRoot,
  vue: vueTimedRoot,
  svelte: svelteTimedRoot,
};
export function renderTimedRoot(target: Target, facts: Facts, plan = timedRecipe(facts)): string {
  const fw = operations[target],
    projection = projections[target];
  const props = [
    facts.props.defaultOpen,
    facts.props.open,
    ...plan.constructorInputs.map((name) => facts.props[name as keyof Facts["props"]]),
    ...(plan.disabledSetter ? [facts.props.disabled] : []),
  ];
  const initial = `const initialDefaultOpen = ${projection.initial(`${projection.read("defaultOpen")} ?? ${JSON.stringify(plan.model.fallback)}`)};\nconst initialOpen = ${projection.initial(`${plan.disabledSetter ? `!${projection.read("disabled")} && (` : ""}${projection.read("open")} ?? initialDefaultOpen${plan.disabledSetter ? ")" : ""}`)};`;
  const disabledSync = plan.disabledSetter
    ? `function synchronizeDisabled(): void {
  const owned = connection.instance; if (!owned) return;
  owned.${plan.disabledSetter}(${fw.readInput("disabled")});
  applyParentCommand();
  connection.accepted = owned.getOpen();
  ${fw.renderAccepted("open", "connection.accepted")}
  ${fw.modelAuthority === "runtime-binding" ? fw.untracked(fw.publishModel("open", "connection.accepted")) : ""}
}\n${projection.observe(["disabled"], "synchronizeDisabled();")}`
    : "";
  const attrs: [string, string?][] = [
    [facts.attrs.root],
    ["data-sw-part", "'root'"],
    [facts.attrs.rootDefaultOpen, "initialDefaultOpen ? 'true' : undefined"],
    [facts.attrs.rootCloseDelay, projection.read("closeDelay")],
    [facts.attrs.rootCloseOnEscape, `String(${projection.read("closeOnEscape")})`],
    [
      facts.attrs.rootCloseOnOutsideInteract,
      `String(${projection.read("closeOnOutsideInteract")})`,
    ],
    [facts.attrs.rootContentHoverable, `String(!${projection.read("disableHoverableContent")})`],
    [facts.attrs.rootOpenDelay, projection.read("openDelay")],
    [
      facts.attrs.rootState,
      `${plan.disabledSetter ? `!${projection.read("disabled")} && ` : ""}renderedOpen ? 'open' : 'closed'`,
    ],
  ];
  if (plan.disabledSetter)
    attrs.push([facts.attrs.rootDisabled!, `${projection.read("disabled")} ? '' : undefined`]);
  return projection
    .print({
      facts,
      plan,
      props,
      fields: props.map((p) => `${p.name}?: ${p.type};`).join("\n"),
      initial,
      accepted: fw.acceptedCell("open", "boolean", "initialOpen"),
      controller: fw.controllerCell(emitConnectionType(plan), "initialOpen"),
      lifecycle: emitLifecycle(plan, fw),
      attributes: attrs.map(([name, value]) => projection.attribute(name, value)).join("\n"),
      placement: authoredPlacementStorage(target, plan.surface),
      connectSurface: connectPopoverSurface(target, plan.surface),
      disabledSync,
      observeModel: fw.observeModel("open", "reconnectRuntime"),
    })
    .replace(/^[\t ]+$/gm, "");
}
