import type { RuntimeAdapterContract } from "../types.js";

export const tabsRuntimeAdapterContract = {
  component: "tabs",
  category: "controlled-value-group",
  displayName: "Tabs",
  runtime: {
    factory: "createTabs",
    importSource: "@starwind-ui/runtime/tabs",
    rootPart: "root",
    optionProps: ["defaultValue", "orientation", "syncKey", "value"],
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-tabs",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-default-value", source: "prop" },
        { name: "data-orientation", source: "prop" },
        { name: "data-sync-key", source: "prop" },
        { name: "data-value", source: "state" },
      ],
    },
    {
      name: "list",
      defaultElement: "div",
      discoveryAttribute: "data-sw-tabs-list",
      forwardsRef: true,
      role: "tablist",
      initialAttributes: [
        { name: "aria-orientation", source: "prop" },
        { name: "data-activate-on-focus", source: "prop" },
        { name: "data-loop-focus", source: "prop" },
        { name: "data-orientation", source: "prop" },
      ],
    },
    {
      name: "tab",
      defaultElement: "button",
      discoveryAttribute: "data-sw-tabs-tab",
      forwardsRef: true,
      role: "tab",
      initialAttributes: [
        { name: "aria-selected", source: "state" },
        { name: "data-active", source: "state" },
        { name: "data-disabled", source: "prop" },
        { name: "data-orientation", source: "state" },
        { name: "data-state", source: "state" },
        { name: "data-value", source: "prop" },
        { name: "type", source: "constant", value: "button" },
      ],
    },
    {
      name: "panel",
      defaultElement: "div",
      discoveryAttribute: "data-sw-tabs-panel",
      forwardsRef: true,
      role: "tabpanel",
      initialAttributes: [
        { name: "data-active", source: "state" },
        { name: "data-keep-mounted", source: "prop" },
        { name: "data-orientation", source: "state" },
        { name: "data-state", source: "state" },
        { name: "data-value", source: "prop" },
        { name: "hidden", source: "state" },
      ],
    },
    {
      name: "indicator",
      defaultElement: "span",
      discoveryAttribute: "data-sw-tabs-indicator",
      forwardsRef: true,
      role: "presentation",
      initialAttributes: [
        { name: "data-orientation", source: "state" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    { name: "value", kind: "control", targets: ["root"], type: "TabsValue" },
    { name: "defaultValue", kind: "control", type: "TabsValue" },
    {
      defaultValue: '"horizontal"',
      name: "orientation",
      kind: "option",
      type: "TabsOrientation",
    },
    { name: "syncKey", kind: "option", type: "string" },
    { name: "onValueChange", kind: "callback", type: "TabsValueChangeDetails" },
    {
      defaultValue: "false",
      name: "activateOnFocus",
      kind: "option",
      targets: ["list"],
      type: "boolean",
    },
    {
      defaultValue: "true",
      name: "loopFocus",
      kind: "option",
      targets: ["list"],
      type: "boolean",
    },
    { defaultValue: "false", name: "disabled", kind: "option", targets: ["tab"], type: "boolean" },
    {
      defaultValue: "false",
      name: "keepMounted",
      kind: "rendering",
      targets: ["panel"],
      type: "boolean",
    },
    { name: "value", kind: "option", required: true, targets: ["tab"], type: "string" },
    { name: "value", kind: "option", required: true, targets: ["panel"], type: "string" },
  ],
  stateModels: [
    {
      name: "value",
      controlledProp: "value",
      defaultProp: "defaultValue",
      initialAttribute: "data-default-value",
      runtimeGetter: "getValue",
      runtimeSetter: "setValue",
      valueType: "TabsValue",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "valueChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      callbackProp: "onValueChange",
      detailsType: "TabsValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      valueProperty: "value",
      valueType: "TabsValue",
    },
  ],
  setters: [
    {
      method: "setValue",
      options: { emit: false, sync: true },
      stateModel: "value",
      suppressesEmit: true,
    },
  ],
  context: [
    {
      name: "tabs",
      direction: "provides",
      values: ["orientation", "value"],
    },
  ],
  presence: {
    keepMountedProp: "keepMounted",
    initialHiddenParts: [],
    unmountPolicy: "runtime-owned-visibility",
  },
  refs: [
    { part: "root", public: true },
    { part: "list", public: true },
    { part: "tab", public: true },
    { part: "panel", public: true },
    { part: "indicator", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-tabs",
        "data-default-value",
        "data-orientation",
        "data-sync-key",
        "data-value",
      ],
      reason:
        "The tabs root needs initial value, orientation, and optional sync key before controller hydration.",
    },
    {
      part: "list",
      attributes: ["data-sw-tabs-list", "data-activate-on-focus", "data-loop-focus"],
      reason:
        "The tab list needs focus policy markers before the runtime refreshes orientation, linked tabs, and roles.",
    },
    {
      part: "tab",
      attributes: ["data-sw-tabs-tab", "data-disabled", "data-value", "type"],
      reason:
        "Tabs need value identity and button semantics before the controller wires ARIA, roving focus, state, and panel ids.",
    },
    {
      part: "panel",
      attributes: ["data-sw-tabs-panel", "data-keep-mounted", "data-value"],
      reason:
        "Panels start from stable value and keep-mounted markers; the runtime links ids and active visibility during refresh.",
    },
    {
      part: "indicator",
      attributes: ["data-sw-tabs-indicator"],
      reason:
        "The indicator receives presentation semantics, visibility, and measured CSS variables from the runtime once an active tab is available.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render initial tab anatomy and self-initialize; runtime refresh owns linked ids, roving focus, nested tabs, and indicator measurement.",
      'Runtime treats an empty string as a valid TabsValue and reserves literal "null" as the nullable serialization marker.',
    ],
    react: [
      "Bridge controlled value through setValue with sync propagation and provide context so child parts can render initial orientation/value state.",
      'Runtime treats an empty string as a valid TabsValue and reserves literal "null" as the nullable serialization marker.',
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns nullable TabsValue serialization, framework context/provider wiring for child parts, controlled rendered value state, value-change cancellation handling, creation-only syncKey storage/event wiring, orientation refresh timing, linked tab/panel accessibility ids, list focus-policy reads, nested tab initialization, indicator geometry CSS variables, and structural child changes that require controller refresh.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/list/tab/panel/indicator parts and discovery attributes",
        "public prop names and defaults",
        "value state model",
        "value-change event/callback/details value",
        "value-change cancelability and before-commit callback timing",
        "value setter name and sync suppression options",
        "tabs framework context provider facts",
        "presence keep-mounted prop",
        "deterministic initial root/list/tab/panel/indicator attributes",
      ],
      demotionCriteria:
        "Demote when a shared linked-parts value template can express nullable value serialization, framework context providers, cancellation-aware controlled state, sync storage policy, refresh timing, linked ids, list focus policy, nested refresh, and indicator measurement across frameworks.",
      reason:
        "Tabs combines grouped value control with linked accessibility parts, optional cross-instance syncing, nested runtime refresh, and measured indicator state.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
