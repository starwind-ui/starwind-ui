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

/** The six docs charts. Each draws from chart spec parts and from its reference chart module. */
export const SPEC_CHARTS = ["bar", "area", "line", "donut", "radar", "radial"] as const;

/**
 * Chart spec part cases (React, Vue and Svelte): each docs chart as parts and as its module, a live
 * bar chart that changes its parts, a bar chart with no ChartXAxis, a container without parts, and
 * parts with a chart module.
 */
export const SPEC_CASES = [
  ...SPEC_CHARTS.map((kind) => `spec-${kind}` as const),
  ...SPEC_CHARTS.map((kind) => `spec-module-${kind}` as const),
  "spec-live",
  "spec-no-axis",
  "spec-empty",
  "spec-combined",
  "spec-options",
  "spec-pie-text",
  "spec-radar-grid",
  "spec-tooltip-keys",
  "spec-cursor-order",
  "spec-gradient",
  "spec-labels",
  "spec-nested",
  "spec-legend-first",
  "spec-legend-wrapped",
] as const;

export type SpecCase = (typeof SPEC_CASES)[number];

export type ParityCase =
  | SpecCase
  | (typeof PARITY_MODES)[number]
  | (typeof EXTRA_CASES)[number]
  | (typeof SNAP_CASES)[number]
  | (typeof ASTRO_ONLY_CASES)[number]
  | (typeof FRAMEWORK_ONLY_CASES)[number];
