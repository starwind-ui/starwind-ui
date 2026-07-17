import type { RuntimeAdapterContract } from "../types.js";

export const accordionRuntimeAdapterContract = {
  component: "accordion",
  category: "controlled-value-group",
  displayName: "Accordion",
  runtime: {
    factory: "createAccordion",
    importSource: "@starwind-ui/runtime/accordion",
    rootPart: "root",
    optionProps: ["type", "defaultValue", "collapsible", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-accordion",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-type", source: "prop" },
        { name: "data-default-value", source: "prop" },
        { name: "data-collapsible", source: "prop" },
        { name: "data-state", source: "state" },
      ],
    },
    {
      name: "item",
      defaultElement: "div",
      discoveryAttribute: "data-sw-accordion-item",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-value", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "data-state", source: "state" },
      ],
    },
    {
      name: "header",
      defaultElement: "h3",
      discoveryAttribute: "data-sw-accordion-header",
      forwardsRef: true,
    },
    {
      name: "trigger",
      defaultElement: "button",
      discoveryAttribute: "data-sw-accordion-trigger",
      forwardsRef: true,
      initialAttributes: [
        { name: "type", source: "constant", value: "button" },
        { name: "aria-expanded", source: "state" },
        { name: "data-state", source: "state" },
      ],
    },
    {
      name: "panel",
      defaultElement: "div",
      discoveryAttribute: "data-sw-accordion-content",
      forwardsRef: true,
      role: "region",
      initialAttributes: [
        { name: "data-state", source: "state" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", targets: ["root"], type: "AccordionValue" },
    { name: "defaultValue", kind: "control", type: "AccordionValue" },
    {
      defaultValue: '"single"',
      name: "type",
      kind: "option",
      type: '"single" | "multiple"',
    },
    { defaultValue: "true", name: "collapsible", kind: "option", type: "boolean" },
    { name: "onValueChange", kind: "callback", type: "AccordionValueChangeDetails" },
    { name: "value", kind: "option", targets: ["item"], type: "string" },
    {
      defaultValue: "false",
      name: "disabled",
      kind: "option",
      targets: ["item"],
      type: "boolean",
    },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-default-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "AccordionValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackProp: "onValueChange",
      detailsType: "AccordionValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "AccordionValue",
    },
  ],
  setters: [
    { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
  ],
  presence: {
    initialHiddenParts: ["panel"],
    unmountPolicy: "runtime-owned-visibility",
  },
  refs: [
    { part: "root", public: true },
    { part: "item", public: true },
    { part: "header", public: true },
    { part: "trigger", public: true },
    { part: "panel", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-accordion",
        "data-type",
        "data-default-value",
        "data-collapsible",
        "data-state",
      ],
      reason:
        "The root needs type, default value, collapsibility, and initial closed state before controller hydration.",
    },
    {
      part: "item",
      attributes: ["data-sw-accordion-item", "data-value", "data-disabled", "data-state"],
      reason:
        "Items need stable value, disabled, and closed-state markers before trigger and panel ids are linked.",
    },
    {
      part: "trigger",
      attributes: ["data-sw-accordion-trigger", "type", "aria-expanded", "data-state"],
      reason:
        "Triggers need button semantics and collapsed affordances before the runtime wires aria-controls.",
    },
    {
      part: "panel",
      attributes: ["data-sw-accordion-content", "data-state", "hidden"],
      reason:
        "Panels start hidden and closed; the runtime controls height variables and close-animation visibility.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render closed/default-open placeholders and self-initialize; runtime owns item discovery, ids, keyboard navigation, and panel animation.",
    ],
    react: [
      "Bridge controlled value through setValue without emitting duplicate events; type, defaultValue, and collapsible recreate the controller.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns AccordionValue serialization/equality, creation-only type/defaultValue/collapsible options, runtime-owned item discovery, trigger/panel accessibility id linking, keyboard navigation, collapsible panel height measurement, close-animation hidden cleanup, and structural child changes that currently require controller recreation because the runtime exposes no refresh API.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/item/header/trigger/panel parts and discovery attributes",
        "public prop names and defaults",
        "value state model",
        "value-change event/callback/details value",
        "value setter name and suppression options",
        "presence panel part and initial hidden state",
        "initial root/item/trigger/panel attributes",
      ],
      demotionCriteria:
        "Demote when a shared linked-disclosure template can express value normalization, creation-only options, item discovery refresh policy, linked ids, keyboard navigation, and animation-aware visibility across frameworks.",
      reason:
        "Accordion combines controlled value state with repeated disclosure items and runtime-owned collapsible panel animation.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
