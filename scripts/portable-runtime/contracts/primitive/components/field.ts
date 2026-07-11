import type { RuntimeAdapterContract } from "../types.js";

export const fieldRuntimeAdapterContract = {
  component: "field",
  category: "field-control-coordinator",
  displayName: "Field",
  runtime: {
    factory: "createField",
    importSource: "@starwind-ui/runtime/field",
    rootPart: "root",
    optionProps: ["dirty", "disabled", "invalid", "name", "touched"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-field",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-dirty", source: "state" },
        { name: "data-disabled", source: "prop" },
        { name: "data-invalid", source: "state" },
        { name: "data-name", source: "prop" },
        { name: "data-touched", source: "state" },
      ],
    },
    {
      name: "label",
      defaultElement: "label",
      discoveryAttribute: "data-sw-field-label",
      forwardsRef: true,
    },
    {
      name: "control",
      defaultElement: "input",
      discoveryAttribute: "data-sw-field-control",
      forwardsRef: true,
      initialAttributes: [{ name: "data-sw-input", source: "constant" }],
    },
    {
      name: "description",
      defaultElement: "p",
      discoveryAttribute: "data-sw-field-description",
      forwardsRef: true,
    },
    {
      name: "item",
      defaultElement: "div",
      discoveryAttribute: "data-sw-field-item",
      forwardsRef: true,
    },
    {
      name: "error",
      defaultElement: "div",
      discoveryAttribute: "data-sw-field-error",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-match", source: "prop" },
        { name: "data-message-source", source: "prop" },
        { name: "hidden", source: "state" },
      ],
    },
    {
      name: "validity",
      defaultElement: "div",
      discoveryAttribute: "data-sw-field-validity",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-match", source: "prop" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    { name: "dirty", kind: "control", type: "boolean" },
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    { name: "invalid", kind: "control", type: "boolean" },
    { name: "name", kind: "option", type: "string" },
    { name: "touched", kind: "control", type: "boolean" },
    {
      defaultValue: "false",
      name: "match",
      kind: "attribute",
      targets: ["error"],
      type: "FieldErrorMatch",
    },
    {
      defaultValue: "true",
      name: "match",
      kind: "attribute",
      targets: ["validity"],
      type: "FieldErrorMatch",
    },
    {
      name: "messageSource",
      kind: "attribute",
      targets: ["error"],
      type: '"children" | "validation"',
    },
  ],
  stateModels: [
    {
      name: "dirty",
      controlledProp: "dirty",
      runtimeSetter: "setDirty",
      valueType: "boolean",
      controlledStateSync: "unsupported",
    },
    {
      name: "touched",
      controlledProp: "touched",
      runtimeSetter: "setTouched",
      valueType: "boolean",
      controlledStateSync: "unsupported",
    },
  ],
  setters: [
    { method: "setDirty", prop: "dirty" },
    { method: "setDisabled", prop: "disabled" },
    { method: "setInvalid", prop: "invalid" },
    { method: "setName", prop: "name" },
    { method: "setTouched", prop: "touched" },
  ],
  refs: [
    { part: "root", public: true },
    { part: "label", public: true },
    { part: "control", public: true },
    { part: "description", public: true },
    { part: "item", public: true },
    { part: "error", public: true },
    { part: "validity", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-field",
        "data-dirty",
        "data-disabled",
        "data-invalid",
        "data-name",
        "data-touched",
      ],
      reason:
        "Field-owned control state must be available for styling and ownership before the controller attaches.",
    },
    {
      part: "control",
      attributes: ["data-sw-field-control", "data-sw-input"],
      reason:
        "The generated default Field control must be discoverable as both a Field control and an Input primitive.",
    },
    {
      part: "error",
      attributes: ["data-sw-field-error", "data-match", "data-message-source", "hidden"],
      reason: "Validation messaging starts hidden and is revealed by the Field controller.",
    },
    {
      part: "validity",
      attributes: ["data-sw-field-validity", "data-match", "hidden"],
      reason: "Validity messaging starts hidden and is revealed by the Field controller.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render initial Field state attributes and let the runtime controller own subsequent coordination.",
    ],
    react: [
      "Bridge root prop updates through Field setter methods without recreating the controller.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "FieldControl's InputRoot composition, input value/change prop aliases, and FieldError match union remain component-template logic.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "parts and discovery attributes",
        "root option prop names and defaults",
        "invalid override prop and setter",
        "behavior-linked label, description, error, and validity parts",
        "passive item state mirror part",
        "Form-owned validation display state attributes",
        "root setter names",
        "root and error initial attributes",
        "public refs",
      ],
      demotionCriteria:
        "Demote when the primitive contract supports cross-primitive part composition and framework-specific prop aliases.",
      reason:
        "Encoding InputRoot composition generically before more controls are migrated would create a second composition system.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
