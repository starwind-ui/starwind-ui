import type { RuntimeAdapterContract } from "../types.js";

export const inputRuntimeAdapterContract = {
  component: "input",
  category: "form-value-control",
  displayName: "Input",
  runtime: {
    factory: "createInput",
    importSource: "@starwind-ui/runtime/input",
    rootPart: "root",
    optionProps: ["defaultValue", "disabled", "onValueChange", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "input",
      discoveryAttribute: "data-sw-input",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-disabled", source: "prop" },
        { name: "disabled", source: "prop" },
        { name: "value", source: "prop" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", type: "InputValue" },
    { name: "defaultValue", kind: "control", type: "InputValue" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "name", kind: "attribute", targets: ["root"], type: "string" },
    { name: "required", kind: "attribute", targets: ["root"], type: "boolean" },
    { name: "onValueChange", kind: "callback", type: "InputValueChangeDetails" },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "InputValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackProp: "onValueChange",
      detailsType: "InputValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "string",
    },
  ],
  setters: [
    { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
    { method: "setDisabled", prop: "disabled" },
  ],
  form: {
    fieldIntegration: true,
    props: ["name", "required", "value"],
  },
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-input", "data-disabled", "disabled", "value"],
      reason:
        "The native input must participate in forms and expose disabled/value state before the controller attaches.",
    },
  ],
  frameworkNotes: {
    astro: ["Render the initial native input value; runtime owns later DOM state after hydration."],
    react: [
      "Bridge controlled value updates through setValue while preserving React onChange ordering.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["react", "solid", "svelte", "vue"],
      boundary:
        "Controlled native input event ordering and post-change controlled sync remain framework-template logic.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root part and discovery attribute",
        "value/defaultValue prop names and public value type",
        "value-change event/callback/runtime option/details value",
        "normalized callback value type",
        "value and disabled setter names",
        "initial root attributes",
      ],
      demotionCriteria:
        "Demote when a shared native value-control template can express framework-specific controlled input synchronization.",
      reason:
        "React's native input reconciliation requires precise event ordering that should not be over-modeled as generic metadata yet.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
