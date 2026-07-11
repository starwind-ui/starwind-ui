import type { RuntimeAdapterContract } from "../types.js";

export const toggleRuntimeAdapterContract = {
  component: "toggle",
  category: "single-boolean-control",
  displayName: "Toggle",
  runtime: {
    factory: "createToggle",
    importSource: "@starwind-ui/runtime/toggle",
    rootPart: "root",
    optionProps: ["defaultPressed", "disabled", "nativeButton", "pressed", "syncGroup", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "button",
      discoveryAttribute: "data-sw-toggle",
      forwardsRef: true,
      initExclusionAttributes: ["data-sw-theme-toggle"],
      ownsRuntime: true,
      initialAttributes: [
        { name: "aria-disabled", source: "prop" },
        { name: "aria-pressed", source: "state" },
        { name: "data-default-pressed", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-native", source: "prop" },
        { name: "data-pressed", source: "state" },
        { name: "data-state", source: "state" },
        { name: "data-sync-group", source: "prop" },
        { name: "data-unpressed", source: "state" },
        { name: "data-value", source: "prop" },
      ],
    },
  ],
  props: [
    { name: "pressed", kind: "control", type: "boolean" },
    {
      defaultValue: "false",
      name: "defaultPressed",
      kind: "control",
      type: "boolean",
    },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    {
      defaultValue: "true",
      name: "nativeButton",
      kind: "rendering",
      targets: ["root"],
      type: "boolean",
    },
    { name: "syncGroup", kind: "option", type: "string" },
    { name: "value", kind: "option", type: "string" },
    { name: "onPressedChange", kind: "callback", type: "TogglePressedChangeDetails" },
  ],
  stateModels: [
    {
      name: "pressed",
      controlledProp: "pressed",
      defaultProp: "defaultPressed",
      initialAttribute: "data-default-pressed",
      runtimeGetter: "getPressed",
      runtimeSetter: "setPressed",
      valueType: "boolean",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "pressedChange",
      callbackProp: "onPressedChange",
      detailsType: "TogglePressedChangeDetails",
      domEvent: "starwind:pressed-change",
      emitsFrom: "root",
      valueProperty: "pressed",
    },
  ],
  setters: [
    {
      method: "setPressed",
      options: { emit: false, sync: true },
      stateModel: "pressed",
      suppressesEmit: true,
    },
    { method: "setDisabled", prop: "disabled" },
  ],
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-toggle",
        "aria-pressed",
        "data-default-pressed",
        "data-state",
        "data-value",
      ],
      reason: "Toggle state styling and ARIA button state must be correct before hydration.",
    },
  ],
  frameworkNotes: {
    astro: ["Render uncontrolled initial pressed state; runtime owns updates after hydration."],
    react: [
      "Bridge controlled pressed updates through setPressed with sync enabled for sync groups.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns the native button vs span rendering branch, TypeScript prop composition, and exact JSX/Astro control-flow shape.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root part and discovery attribute",
        "public prop names and defaults",
        "pressed state model",
        "pressed-change event/callback/details value",
        "controlled setter and disabled setter names",
        "initial root attributes",
      ],
      demotionCriteria:
        "Demote when a shared single-boolean-control template can express native/non-native element branching and framework-specific prop typing.",
      reason:
        "The branch is framework syntax rather than runtime behavior; forcing it into generic metadata now would over-model the contract.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
