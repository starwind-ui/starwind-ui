import { reactComboboxOperations } from "../../framework-adapters/react/recipe-combobox-operations.js";
import { svelteComboboxOperations } from "../../framework-adapters/svelte/recipe-combobox-operations.js";
import { vueComboboxOperations } from "../../framework-adapters/vue/recipe-combobox-operations.js";
import type { Target } from "./operations.js";
import type { SelectOperations } from "./select-operations.js";
export interface ComboboxOperations extends SelectOperations {
  observeModel(
    channel: import("./select-operations.js").SelectChannel & { getter: string },
    body: string,
  ): string;
  /** The model input to apply now. Defaults to the input itself. */
  command?(name: string): string;
  settleLabel(value: string): string;
  resolveLazyInitialText?(value: string): string;
  resolveLazyText?(value: string): string;
  rememberLabel(value: string, item: string, instance: string): string;
  own(instance: string): string;
  subscribe(instance: string, event: string, body: string): string;
}
export const comboboxOperations: Record<Target, ComboboxOperations> = {
  react: reactComboboxOperations,
  vue: vueComboboxOperations,
  svelte: svelteComboboxOperations,
};
