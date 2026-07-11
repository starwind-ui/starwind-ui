import type { RuntimeAdapterContract } from "../types.js";

export const progressRuntimeAdapterContract = {
  component: "progress",
  category: "static-semantic",
  displayName: "Progress",
  runtime: {
    factory: "createProgress",
    importSource: "@starwind-ui/runtime/progress",
    rootPart: "root",
    optionProps: ["format", "getAriaValueText", "locale", "max", "min", "value"],
    optionPropLifecycles: {
      format: "setter-backed",
      getAriaValueText: "setter-backed",
      locale: "setter-backed",
      max: "setter-backed",
      min: "setter-backed",
      value: "setter-backed",
    },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-progress",
      forwardsRef: true,
      ownsRuntime: true,
      role: "progressbar",
      initialAttributes: [
        { name: "data-value", source: "state" },
        { name: "data-min", source: "prop" },
        { name: "data-max", source: "prop" },
        { name: "data-indeterminate", source: "state" },
      ],
    },
    {
      name: "track",
      defaultElement: "div",
      discoveryAttribute: "data-sw-progress-track",
      forwardsRef: true,
    },
    {
      name: "indicator",
      defaultElement: "div",
      discoveryAttribute: "data-sw-progress-indicator",
      forwardsRef: true,
    },
    {
      name: "value",
      defaultElement: "span",
      discoveryAttribute: "data-sw-progress-value",
      forwardsRef: true,
      initialAttributes: [
        { name: "aria-hidden", source: "constant", value: "true" },
        { name: "data-preserve-text", source: "prop" },
      ],
    },
    {
      name: "label",
      defaultElement: "span",
      discoveryAttribute: "data-sw-progress-label",
      forwardsRef: true,
      initialAttributes: [{ name: "role", source: "constant", value: "presentation" }],
    },
  ],
  props: [
    { defaultValue: "null", name: "value", kind: "control", type: "number | null" },
    { defaultValue: "100", name: "max", kind: "option", type: "number" },
    { defaultValue: "0", name: "min", kind: "option", type: "number" },
    {
      name: "format",
      kind: "option",
      type: "Intl.NumberFormatOptions",
      unsupportedTargets: ["astro"],
    },
    {
      name: "getAriaValueText",
      kind: "option",
      type: "(formattedValue: string | null, value: ProgressValue) => string",
      unsupportedTargets: ["astro"],
    },
    {
      name: "locale",
      kind: "option",
      type: "Intl.LocalesArgument",
      unsupportedTargets: ["astro"],
    },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      initialAttribute: "data-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "ProgressValue",
      controlledStateSync: "unsupported",
    },
  ],
  setters: [
    {
      method: "setFormatOptions",
      props: ["format", "getAriaValueText", "locale"],
    },
    {
      method: "setValue",
      props: ["value", "max", "min"],
      suppressesEmit: true,
    },
  ],
  refs: [
    { part: "root", public: true },
    { part: "track", public: true },
    { part: "indicator", public: true },
    { part: "value", public: true },
    { part: "label", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-progress",
        "data-value",
        "data-min",
        "data-max",
        "data-indeterminate",
        "role",
      ],
      reason:
        "The progressbar needs deterministic value/range markers and progressbar semantics before the runtime computes ARIA value text.",
    },
    {
      part: "track",
      attributes: ["data-sw-progress-track"],
      reason: "The track is a stable runtime target for status attributes.",
    },
    {
      part: "indicator",
      attributes: ["data-sw-progress-indicator"],
      reason: "The indicator is positioned by the runtime after percent calculation.",
    },
    {
      part: "value",
      attributes: ["data-sw-progress-value", "aria-hidden", "data-preserve-text"],
      reason:
        "Value text is runtime-generated unless the adapter marks caller-provided text for preservation.",
    },
    {
      part: "label",
      attributes: ["data-sw-progress-label", "role"],
      reason: "Labels can be linked to the root by the runtime when no explicit ARIA label exists.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render static value/range markers and self-initialize; runtime owns status, ARIA value text, label linking, and indicator transform.",
    ],
    react: [
      "Create the controller once and bridge value/min/max plus formatting option changes through runtime setters.",
    ],
  },
} as const satisfies RuntimeAdapterContract;
