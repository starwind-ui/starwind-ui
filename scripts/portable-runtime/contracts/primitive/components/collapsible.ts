import type { RuntimeAdapterContract } from "../types.js";

export const collapsibleRuntimeAdapterContract = {
  component: "collapsible",
  category: "presence-disclosure-control",
  displayName: "Collapsible",
  runtime: {
    factory: "createCollapsible",
    importSource: "@starwind-ui/runtime/collapsible",
    rootPart: "root",
    optionProps: ["defaultOpen", "disabled", "open"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-collapsible",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-default-open", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-state", source: "state" },
      ],
    },
    {
      name: "trigger",
      defaultElement: "button",
      discoveryAttribute: "data-sw-collapsible-trigger",
      forwardsRef: true,
      initialAttributes: [
        { name: "aria-expanded", source: "state" },
        { name: "data-state", source: "state" },
      ],
    },
    {
      name: "panel",
      defaultElement: "div",
      discoveryAttribute: "data-sw-collapsible-panel",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-hidden-until-found", source: "prop" },
        { name: "data-state", source: "state" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    { name: "open", kind: "control", type: "boolean" },
    { defaultValue: "false", name: "defaultOpen", kind: "control", type: "boolean" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "onOpenChange", kind: "callback", type: "CollapsibleOpenChangeDetails" },
    {
      defaultValue: "false",
      name: "asChild",
      kind: "rendering",
      targets: ["trigger"],
      type: "boolean",
    },
    {
      defaultValue: "false",
      name: "hiddenUntilFound",
      kind: "rendering",
      targets: ["panel"],
      type: "boolean",
    },
  ],
  stateModels: [
    {
      name: "open",
      controlledProp: "open",
      defaultProp: "defaultOpen",
      initialAttribute: "data-default-open",
      runtimeGetter: "getOpen",
      runtimeSetter: "setOpen",
      valueType: "boolean",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "openChange",
      callbackProp: "onOpenChange",
      detailsType: "CollapsibleOpenChangeDetails",
      domEvent: "starwind:open-change",
      emitsFrom: "root",
      valueProperty: "open",
      valueType: "boolean",
      callbackTiming: "before-state-commit",
      cancelable: true,
    },
  ],
  setters: [
    { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
  ],
  presence: {
    initialHiddenParts: ["panel"],
    unmountPolicy: "runtime-owned-visibility",
  },
  refs: [
    { part: "root", public: true },
    { part: "trigger", public: true },
    { part: "panel", public: true },
  ],
  asChild: [{ part: "trigger", merges: ["aria", "className", "data", "ref"] }],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-collapsible", "data-default-open", "data-disabled", "data-state"],
      reason: "The disclosure root needs initial open/closed state for styling before hydration.",
    },
    {
      part: "trigger",
      attributes: ["data-sw-collapsible-trigger", "aria-expanded", "data-state"],
      reason:
        "The trigger starts with stable disclosure affordances; the runtime wires ids and aria-controls after initialization.",
    },
    {
      part: "panel",
      attributes: ["data-sw-collapsible-panel", "data-hidden-until-found", "data-state", "hidden"],
      reason:
        "The panel starts hidden and is revealed or animated by the runtime controller; hidden-until-found keeps opted-in closed panels discoverable by browser find-in-page.",
    },
  ],
  frameworkNotes: {
    astro: ["Render static closed/open markup and let the runtime own ids and panel lifecycle."],
    react: [
      "Bridge controlled open updates through setOpen; recreate the controller for creation-only disabled/defaultOpen options.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns trigger asChild rendering/cloneElement behavior, Astro's data-as-child wrapper marker, framework ref merging, creation-only disabled/defaultOpen options, and runtime-owned trigger/panel accessibility ids plus hide/show close-animation cleanup.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/trigger/panel parts and discovery attributes",
        "public prop names and defaults",
        "panel hidden-until-found opt-in",
        "open state model",
        "open-change event/callback/details value",
        "open setter name",
        "asChild trigger merge requirements",
        "presence panel part and initial hidden state",
        "initial root/trigger/panel attributes",
      ],
      demotionCriteria:
        "Demote when a shared disclosure-control template can express framework-specific asChild semantics, ref merging, creation-only options, and runtime-owned accessibility plus visibility boundaries.",
      reason:
        "Collapsible is a small disclosure primitive, but asChild and runtime-owned panel accessibility are framework-specific enough to keep as bounded template logic.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
