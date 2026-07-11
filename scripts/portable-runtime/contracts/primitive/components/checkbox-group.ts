import type { RuntimeAdapterContract } from "../types.js";

export const checkboxGroupRuntimeAdapterContract = {
  component: "checkbox-group",
  category: "controlled-value-group",
  displayName: "CheckboxGroup",
  runtime: {
    factory: "createCheckboxGroup",
    importSource: "@starwind-ui/runtime/checkbox-group",
    rootPart: "root",
    optionProps: ["defaultValue", "disabled", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-checkbox-group",
      forwardsRef: true,
      ownsRuntime: true,
      role: "group",
      initialAttributes: [
        { name: "data-default-value", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-value", source: "state" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", type: "CheckboxGroupValue" },
    { name: "defaultValue", kind: "control", type: "CheckboxGroupValue" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "onValueChange", kind: "callback", type: "CheckboxGroupValueChangeDetails" },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-default-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "CheckboxGroupValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      callbackProp: "onValueChange",
      detailsType: "CheckboxGroupValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "CheckboxGroupValue",
    },
  ],
  setters: [
    { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
    { method: "setDisabled", prop: "disabled" },
  ],
  context: [
    {
      name: "checkbox-group",
      direction: "provides",
      values: ["disabled", "value"],
    },
  ],
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-checkbox-group",
        "role",
        "data-default-value",
        "data-disabled",
        "data-value",
      ],
      reason:
        "The checkbox group needs initial selection and disabled state for child checkbox styling before hydration.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render uncontrolled initial group value only; child Checkbox coordination is runtime-owned.",
    ],
    react: [
      "Bridge controlled value updates through setValue and provide framework context so child Checkbox components can derive effective disabled and group value props.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns CheckboxGroupValue normalization/serialization, framework context/provider wiring for child Checkbox props, uncontrolled rendered value state, runtime-owned child Checkbox discovery and form-option synchronization, and structural child changes that currently require controller recreation until the runtime exposes a refresh API.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root part and discovery attribute",
        "public prop names and defaults",
        "value state model",
        "value-change event/callback/details value",
        "value and disabled setter names",
        "checkbox-group framework context provider facts",
        "initial root attributes",
      ],
      demotionCriteria:
        "Demote when a shared grouped-value template can express array value serialization, framework context providers, rendered uncontrolled state, runtime-owned child Checkbox coordination, and child refresh/recreation policy across frameworks.",
      reason:
        "Checkbox Group is a value-array provider whose child checkboxes need both DOM runtime membership and framework-specific context for styled component composition.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
