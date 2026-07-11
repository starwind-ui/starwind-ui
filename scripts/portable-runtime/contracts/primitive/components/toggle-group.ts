import type { RuntimeAdapterContract } from "../types.js";

export const toggleGroupRuntimeAdapterContract = {
  component: "toggle-group",
  category: "controlled-value-group",
  displayName: "ToggleGroup",
  runtime: {
    factory: "createToggleGroup",
    importSource: "@starwind-ui/runtime/toggle-group",
    rootPart: "root",
    optionProps: ["defaultValue", "disabled", "loopFocus", "multiple", "orientation", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toggle-group",
      forwardsRef: true,
      ownsRuntime: true,
      role: "group",
      initialAttributes: [
        { name: "data-default-value", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-loop-focus", source: "prop" },
        { name: "data-multiple", source: "prop" },
        { name: "data-orientation", source: "prop" },
        { name: "data-value", source: "state" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", type: "ToggleGroupValue" },
    { name: "defaultValue", kind: "control", type: "ToggleGroupValue" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { defaultValue: "true", name: "loopFocus", kind: "option", type: "boolean" },
    { defaultValue: "false", name: "multiple", kind: "option", type: "boolean" },
    {
      defaultValue: '"horizontal"',
      name: "orientation",
      kind: "option",
      type: '"horizontal" | "vertical"',
    },
    { name: "onValueChange", kind: "callback", type: "ToggleGroupValueChangeDetails" },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-default-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "ToggleGroupValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackProp: "onValueChange",
      detailsType: "ToggleGroupValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "ToggleGroupValue",
    },
  ],
  setters: [
    { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
    { method: "setDisabled", prop: "disabled" },
    { method: "setLoopFocus", prop: "loopFocus" },
    { method: "setMultiple", prop: "multiple" },
    { method: "setOrientation", prop: "orientation" },
  ],
  context: [
    {
      name: "toggle-group",
      direction: "provides",
      values: ["disabled", "loopFocus", "multiple", "orientation", "value"],
    },
  ],
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-toggle-group",
        "role",
        "data-default-value",
        "data-disabled",
        "data-loop-focus",
        "data-multiple",
        "data-orientation",
        "data-value",
      ],
      reason:
        "The value group needs initial selection, orientation, and group state for styling before hydration.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render uncontrolled initial group value only; child Toggle coordination is runtime-owned.",
    ],
    react: [
      "Bridge controlled value updates through setValue and let the runtime coordinate child Toggle roots by DOM membership.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns ToggleGroupValue normalization/serialization, React uncontrolled rendered value state, live loopFocus/multiple/orientation option sync, and runtime-owned child Toggle discovery plus roving-focus coordination.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root part and discovery attribute",
        "public prop names and defaults",
        "value state model",
        "value-change event/callback/details value",
        "value, disabled, loopFocus, multiple, and orientation setter names",
        "toggle-group DOM context provider facts",
        "initial root attributes",
      ],
      demotionCriteria:
        "Demote when a shared grouped-value template can express value-array normalization, creation-only group options, rendered uncontrolled state, and runtime-owned child coordination across frameworks.",
      reason:
        "Toggle Group is a value-array provider, but child Toggle discovery, roving focus, and single/multiple normalization belong to the runtime/template boundary rather than generic metadata.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
