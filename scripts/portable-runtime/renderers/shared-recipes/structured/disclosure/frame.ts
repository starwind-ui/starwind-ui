import { reactDisclosureRoot } from "../../../framework-adapters/react/disclosure-recipe.js";
import { svelteDisclosureRoot } from "../../../framework-adapters/svelte/disclosure-recipe.js";
import { vueDisclosureRoot } from "../../../framework-adapters/vue/disclosure-recipe.js";
import { emitConnectionType, emitLifecycle } from "../emit.js";
import type { Target } from "../operations.js";
import { operations } from "../operations.js";
import type { ConnectionRecipe } from "../plan.js";
import { collapsibleRecipe, contract } from "./recipe.js";
export type DisclosureRootInput = {
  plan: ConnectionRecipe;
  fields: string;
  initial: string;
  accepted: string;
  controller: string;
  lifecycle: string;
  modelObserver: string;
  attributes: string;
};
export interface DisclosureRootProjection {
  initialCell(expression: string): string;
  readInput(name: string): string;
  attribute(name: string, expression?: string): string;
  print(input: DisclosureRootInput): string;
}
const projections: Record<Target, DisclosureRootProjection> = {
  react: reactDisclosureRoot,
  vue: vueDisclosureRoot,
  svelte: svelteDisclosureRoot,
};
export function renderCollapsibleRoot(
  target: Target,
  plan: ConnectionRecipe = collapsibleRecipe,
): string {
  const fw = operations[target];
  const projection = projections[target];
  const initial = `const initialDefaultOpen = ${projection.initialCell(`${projection.readInput(plan.model.default)} ?? ${JSON.stringify(plan.model.fallback)}`)};\nconst initialOpen = ${projection.initialCell(`${projection.readInput(plan.model.name)} ?? initialDefaultOpen`)};`;
  const attributes = [
    projection.attribute(contract.parts[0].discoveryAttribute),
    projection.attribute("data-sw-part", "'root'"),
    projection.attribute("data-default-open", "initialDefaultOpen ? 'true' : undefined"),
    projection.attribute("data-disabled", `${projection.readInput("disabled")} ? '' : undefined`),
    projection.attribute("data-state", "renderedOpen ? 'open' : 'closed'"),
  ].join("\n");
  return projection
    .print({
      plan,
      attributes,
      fields: contract.props
        .filter((prop) => ["open", "defaultOpen", ...plan.constructorInputs].includes(prop.name))
        .map((prop) => `${prop.name}?: ${prop.type};`)
        .join("\n"),
      initial,
      accepted: fw.acceptedCell(plan.model.name, plan.model.type, "initialOpen"),
      controller: fw.controllerCell(emitConnectionType(plan), "initialOpen"),
      lifecycle: emitLifecycle(plan, fw),
      modelObserver: fw.observeModel(plan.model.name, "reconnectRuntime"),
    })
    .replace(/^[\t ]+$/gm, "");
}
