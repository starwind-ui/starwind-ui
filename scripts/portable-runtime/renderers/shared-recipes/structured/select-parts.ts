import type { Target } from "./operations.js";
import { selectOperations } from "./select-operations.js";

type Projection =
  | "selected"
  | "selected-marker"
  | "unselected-marker"
  | "selection-state"
  | "unselected";
/** Runtime accepts the value; every part projects that same accepted identity. */
export const selectPartPolicy = {
  identityOperator: "===",
  fallbackOperator: "??",
  item: { "aria-selected": "selected", "data-selected": "selected-marker" },
  indicator: {
    "data-state": "selection-state",
    "data-visible": "selected-marker",
    "data-hidden": "unselected-marker",
    hidden: "unselected",
  },
} as const satisfies {
  identityOperator: "===";
  fallbackOperator: "??";
  item: Record<string, Projection>;
  indicator: Record<string, Projection>;
};
export function selectSelection(rootValue: string, itemValue: string): string {
  return `${rootValue} ${selectPartPolicy.identityOperator} ${itemValue}`;
}
export function selectValueFallback(label: string, placeholder: string): string {
  return `${label} ${selectPartPolicy.fallbackOperator} ${placeholder}`;
}
export function selectSelectionAttributes(target: Target, part: "item" | "indicator"): string {
  const projections: Record<Projection, string> = {
    selected: "selected",
    "selected-marker": 'selected ? "" : undefined',
    "unselected-marker": 'selected ? undefined : ""',
    "selection-state": 'selected ? "checked" : "unchecked"',
    unselected: "!selected",
  };
  return Object.entries(selectPartPolicy[part])
    .map(([name, rule]) => selectOperations[target].attribute(name, projections[rule]))
    .join("\n");
}
