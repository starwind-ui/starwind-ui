import type { RuntimeAdapterContract } from "../types.js";

export const radioRuntimeAdapterContract = {
  component: "radio",
  category: "single-boolean-control",
  displayName: "Radio",
  runtime: {
    factory: "createRadio",
    importSource: "@starwind-ui/runtime/radio",
    rootPart: "root",
    optionProps: [
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "name",
      "readOnly",
      "required",
      "value",
    ],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "span",
      discoveryAttribute: "data-sw-radio",
      forwardsRef: true,
      ownsRuntime: true,
      role: "radio",
      initialAttributes: [
        { name: "aria-checked", source: "state" },
        { name: "data-checked", source: "state" },
        { name: "data-default-checked", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-form", source: "prop" },
        { name: "data-id", source: "prop" },
        { name: "data-name", source: "prop" },
        { name: "data-readonly", source: "prop" },
        { name: "data-required", source: "prop" },
        { name: "data-unchecked", source: "state" },
        { name: "data-value", source: "prop" },
      ],
    },
    {
      name: "indicator",
      defaultElement: "span",
      discoveryAttribute: "data-sw-radio-indicator",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-keep-mounted", source: "prop" },
        { name: "data-unchecked", source: "state" },
      ],
    },
    {
      name: "input",
      defaultElement: "input",
      discoveryAttribute: "data-sw-radio-input",
      initialAttributes: [
        { name: "type", source: "constant", value: "radio" },
        { name: "aria-hidden", source: "constant", value: "true" },
        { name: "tabIndex", source: "constant", value: "-1" },
      ],
    },
  ],
  props: [
    { name: "checked", kind: "control", type: "boolean" },
    { defaultValue: "false", name: "defaultChecked", kind: "control", type: "boolean" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "form", kind: "option", type: "string" },
    { name: "id", kind: "option", type: "string" },
    {
      defaultValue: "false",
      name: "keepMounted",
      kind: "rendering",
      targets: ["indicator"],
      type: "boolean",
    },
    { name: "name", kind: "option", type: "string" },
    {
      defaultValue: "false",
      name: "nativeButton",
      kind: "rendering",
      targets: ["root"],
      type: "boolean",
    },
    { defaultValue: "false", name: "readOnly", kind: "option", type: "boolean" },
    { defaultValue: "false", name: "required", kind: "option", type: "boolean" },
    { name: "value", kind: "option", required: true, type: "string" },
    { name: "onCheckedChange", kind: "callback", type: "RadioCheckedChangeDetails" },
  ],
  stateModels: [
    {
      name: "checked",
      controlledProp: "checked",
      defaultProp: "defaultChecked",
      initialAttribute: "data-default-checked",
      runtimeGetter: "getChecked",
      runtimeSetter: "setChecked",
      valueType: "boolean",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "checkedChange",
      callbackProp: "onCheckedChange",
      detailsType: "RadioCheckedChangeDetails",
      domEvent: "starwind:checked-change",
      emitsFrom: "root",
      valueProperty: "checked",
      valueType: "boolean",
    },
  ],
  setters: [
    { method: "setChecked", options: { emit: false }, stateModel: "checked", suppressesEmit: true },
    { method: "setDisabled", prop: "disabled" },
    { method: "setReadOnly", prop: "readOnly" },
    { method: "setFormOptions", props: ["form", "name", "required", "value"] },
  ],
  context: [
    {
      name: "radio-group",
      direction: "consumes",
      values: ["disabled", "form", "name", "readOnly", "required", "value"],
    },
  ],
  form: {
    hiddenInput: { part: "input", type: "radio" },
    fieldIntegration: true,
    props: ["form", "id", "name", "required", "value"],
  },
  presence: {
    keepMountedProp: "keepMounted",
    initialHiddenParts: ["indicator"],
    unmountPolicy: "runtime-owned",
  },
  refs: [
    { part: "root", public: true },
    { part: "indicator", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-radio",
        "role",
        "aria-checked",
        "data-checked",
        "data-unchecked",
        "data-default-checked",
        "data-disabled",
      ],
      reason: "The visible radio needs ARIA and state styling before the controller attaches.",
    },
    {
      part: "input",
      attributes: ["data-sw-radio-input"],
      reason:
        "The runtime needs the hidden input placeholder so it can attach form state after hydration; native button roots place it as a sibling after the visible button.",
    },
  ],
  frameworkNotes: {
    astro: ["Render uncontrolled initial state only; updates are runtime-owned after hydration."],
    react: [
      "Bridge controlled checked changes through setChecked and derive effective form/name/required/readOnly state from RadioGroup context.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns native button vs span rendering, React radio-group context lookup, effective prop derivation, indicator hidden/ref composition, and hidden input placement.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/indicator/input parts and discovery attributes",
        "public prop names and defaults",
        "required value prop",
        "checked state model",
        "checked-change event/callback/details value",
        "checked, disabled, readOnly, and form-options setter names",
        "radio-group context dependency",
        "presence keep-mounted prop",
        "form props and radio input part",
        "initial root/input placeholder attributes",
      ],
      demotionCriteria:
        "Demote when a shared boolean form-control template can express radio-group effective prop derivation, indicator presence, nested vs sibling hidden input placement, and framework ref wiring.",
      reason:
        "Radio shares the boolean-control model but adds required value identity, radio-group effective props, and grouped form option synchronization.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
