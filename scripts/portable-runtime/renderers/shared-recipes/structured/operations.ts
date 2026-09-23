import { reactFrameworkOperations } from "../../framework-adapters/react/recipe-framework-operations.js";
import { svelteFrameworkOperations } from "../../framework-adapters/svelte/recipe-framework-operations.js";
import { vueFrameworkOperations } from "../../framework-adapters/vue/recipe-framework-operations.js";
/** Target syntax only. Shared recipes choose acceptance, state ownership and operation order. */
export type Target = "react" | "vue" | "svelte";
export interface FrameworkOperations {
  stableValue(expression: string): string;
  modelAuthority: "parent-prop" | "runtime-binding";
  readInput(name: string): string;
  acceptedCell(name: string, type: string, initial: string): string;
  controllerCell(type: string, initial: string): string;
  publishModel(name: string, value: string, selection?: boolean): string;
  renderAccepted(name: string, value: string, inputName?: string): string;
  proposal(
    name: string,
    value: string,
    details: string,
    argumentsShape?: "details" | "value-details",
  ): string;
  completion(name: string, details: string): string;
  controlled(name: string): string;
  untracked(body: string): string;
  /** Register a model observer. Reconnection follows the target's ordinary ownership changes. */
  observeModel(name: string, reconnect?: string): string;
}
export const operations: Record<Target, FrameworkOperations> = {
  react: reactFrameworkOperations,
  vue: vueFrameworkOperations,
  svelte: svelteFrameworkOperations,
};
/** Aliases affect public input/model syntax; local cells keep the shared model name. */
export function modelOperations(
  target: Target,
  name: string,
  publicName: string,
): FrameworkOperations {
  const base = operations[target];
  const alias = (input: string) => (input === name ? publicName : input);
  return {
    ...base,
    readInput: (input) => base.readInput(alias(input)),
    publishModel: (input, value, selection) => base.publishModel(alias(input), value, selection),
    controlled: (input) => base.controlled(alias(input)),
    observeModel: (input, reconnect) => base.observeModel(alias(input), reconnect),
    renderAccepted: (input, value) => base.renderAccepted(input, value, alias(input)),
  };
}
