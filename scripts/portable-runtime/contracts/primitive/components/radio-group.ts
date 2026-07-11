import type { RuntimeAdapterContract } from "../types.js";

export const radioGroupRuntimeAdapterContract = {
  component: "radio-group",
  category: "controlled-value-group",
  displayName: "RadioGroup",
  runtime: {
    factory: "createRadioGroup",
    importSource: "@starwind-ui/runtime/radio-group",
    rootPart: "root",
    optionProps: [
      "defaultValue",
      "disabled",
      "form",
      "name",
      "orientation",
      "readOnly",
      "required",
      "value",
    ],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-radio-group",
      forwardsRef: true,
      ownsRuntime: true,
      role: "radiogroup",
      initialAttributes: [
        { name: "aria-disabled", source: "prop" },
        { name: "aria-orientation", source: "prop" },
        { name: "aria-readonly", source: "prop" },
        { name: "aria-required", source: "prop" },
        { name: "data-default-value", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-form", source: "prop" },
        { name: "data-name", source: "prop" },
        { name: "data-orientation", source: "prop" },
        { name: "data-readonly", source: "prop" },
        { name: "data-required", source: "prop" },
        { name: "data-value", source: "state" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", type: "RadioGroupValue" },
    { name: "defaultValue", kind: "control", type: "RadioGroupValue" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "form", kind: "option", type: "string" },
    { name: "name", kind: "option", type: "string" },
    {
      defaultValue: '"vertical"',
      name: "orientation",
      kind: "option",
      type: '"horizontal" | "vertical"',
    },
    { defaultValue: "false", name: "readOnly", kind: "option", type: "boolean" },
    { defaultValue: "false", name: "required", kind: "option", type: "boolean" },
    { name: "onValueChange", kind: "callback", type: "RadioGroupValueChangeDetails" },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-default-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "RadioGroupValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackProp: "onValueChange",
      detailsType: "RadioGroupValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "string",
    },
  ],
  setters: [
    { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
    { method: "setDisabled", prop: "disabled" },
    { method: "setFormOptions", props: ["form", "name", "required"] },
    { method: "setName", prop: "name" },
    { method: "setOrientation", prop: "orientation" },
    { method: "setReadOnly", prop: "readOnly" },
    { method: "setRequired", prop: "required" },
  ],
  context: [
    {
      name: "radio-group",
      direction: "provides",
      values: ["disabled", "form", "name", "readOnly", "required", "value"],
    },
  ],
  form: {
    fieldIntegration: true,
    props: ["form", "name", "required", "value"],
  },
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-radio-group",
        "role",
        "aria-disabled",
        "aria-orientation",
        "aria-readonly",
        "aria-required",
        "data-default-value",
        "data-disabled",
        "data-form",
        "data-name",
        "data-orientation",
        "data-readonly",
        "data-required",
        "data-value",
      ],
      reason:
        "The radio group needs initial selection, form coordination, and orientation for child radio semantics before hydration.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render uncontrolled initial group value only; child Radio coordination and roving focus are runtime-owned.",
    ],
    react: [
      "Bridge controlled value updates through setValue and provide framework context so child Radio components can derive effective form, disabled, readOnly, required, and value props.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns framework context/provider wiring for child Radio props, uncontrolled rendered value state, live form/orientation/required option bridging, mutable disabled/name/readOnly bridging, runtime-owned child Radio discovery plus roving-focus coordination, and dynamic child refresh.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root part and discovery attribute",
        "public prop names and defaults",
        "value state model",
        "value-change event/callback/details value",
        "value, disabled, form-options, orientation, name, and readOnly setter names",
        "radio-group framework context provider facts",
        "form coordination props",
        "initial root attributes",
      ],
      demotionCriteria:
        "Demote when a shared grouped-value template can express framework context providers, live group option setters, rendered uncontrolled state, runtime-owned child Radio coordination, and child refresh policy across frameworks.",
      reason:
        "Radio Group is a single-value provider whose child radios need both DOM runtime membership and framework-specific context for styled component composition.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
