import type { FrameworkOperations } from "../shared-recipes/structured/operations.js";
/** Target scheduling and native-input projection capabilities used by the form recipe. */
export interface FormTargetOperations extends FrameworkOperations {
  restoreRuntimeInputName: boolean;
  renderMixed(): string;
}

/** Existing part transport differs; visibility decisions come from the shared Indicator policy. */
export const checkboxIndicatorTransport = {
  react: { visibility: "context", restoreAuthoredHidden: true },
  vue: { visibility: "runtime", restoreAuthoredHidden: false },
  svelte: { visibility: "context", restoreAuthoredHidden: false },
} as const satisfies Record<
  "react" | "vue" | "svelte",
  import("../shared-recipes/structured/forms/indicator.js").IndicatorTransport
>;
