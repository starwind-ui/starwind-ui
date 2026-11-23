// The parity case names. This file has no imports, so Node scripts can read it directly.

/** Every parity mode from the prototype, in the order the prototype ran them. */
export const PARITY_MODES = [
  "default",
  "custom",
  "off",
  "native",
  "formatter",
  "native-format",
  "definition",
  "primitive",
  "indicator",
  "preset",
  "model",
  "parts",
  "parts-nested",
] as const;

/** Extra cases from tickets 04-07. */
export const EXTRA_CASES = [
  "plain-body",
  "mixed-body",
  "nested-tooltip",
  "order",
  "ids",
  "cancel",
  "one-way",
  "live-body",
  "legends",
  "precedence",
  "off-child",
  "options",
  "keys",
] as const;

/** Astro-only cases for Astro slot rules that have no counterpart in the other frameworks. */
export const ASTRO_ONLY_CASES = ["icon-source", "conditional-slot"] as const;

/** Cases for framework-only APIs: tooltip body hooks (React, Vue, Svelte) and the Svelte model. */
export const FRAMEWORK_ONLY_CASES = ["hook", "normalize", "callback-order"] as const;

/**
 * Chart types for the tooltip placement cases (tickets 17 and 19). The bar chart uses `default`.
 */
export const SNAP_CASES = ["area", "donut", "radar", "bars-x", "radial", "nested"] as const;

export type ParityCase =
  | (typeof PARITY_MODES)[number]
  | (typeof EXTRA_CASES)[number]
  | (typeof SNAP_CASES)[number]
  | (typeof ASTRO_ONLY_CASES)[number]
  | (typeof FRAMEWORK_ONLY_CASES)[number];
