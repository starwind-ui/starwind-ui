import type { Target } from "./operations.js";
import { selectSelection, selectSelectionAttributes } from "./select-parts.js";
/** Combobox uses the same accepted single-selection identity as Select.
 * Filtering, group visibility, empty state and active descendant stay in Runtime.
 * Markup discovery/roles/floating defaults remain in editable-collection-overlay facts.
 */
export const comboboxPartPolicy = {
  selected: selectSelection,
  selectionAttributes: selectSelectionAttributes,
  inheritedBooleanOperator: "||",
  labelFallback: "empty-text",
} as const;
export function comboboxSelection(rootValue: string, itemValue: string): string {
  return comboboxPartPolicy.selected(rootValue, itemValue);
}
export function comboboxSelectionAttributes(target: Target, part: "item" | "indicator"): string {
  return comboboxPartPolicy.selectionAttributes(target, part);
}
export function comboboxInheritedBoolean(root: string, native: string): string {
  return `${root} ${comboboxPartPolicy.inheritedBooleanOperator} ${native}`;
}
export function comboboxValueFallback(text: string, placeholder: string): string {
  return `${text}.length > 0 ? ${text} : ${placeholder}`;
}
