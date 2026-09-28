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
  settleLabel(value: string): string;
  resolveLazyInitialText?(value: string): string;
  nativeInputRestoresCanceledValue: boolean;
  rememberLabel(value: string, text: string): string;
  selectedText(value: string, item: string): string;
  own(instance: string): string;
  subscribe(instance: string, event: string, body: string): string;
}
export const comboboxOperations: Record<Target, ComboboxOperations> = {
  react: reactComboboxOperations,
  vue: vueComboboxOperations,
  svelte: svelteComboboxOperations,
};
