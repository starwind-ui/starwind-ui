import type { RuntimeAdapterContract } from "../types.js";

export const toastRuntimeAdapterContract = {
  component: "toast",
  category: "notification-system",
  displayName: "Toast",
  runtime: {
    factory: "createToastManager",
    importSource: "@starwind-ui/runtime/toast",
    rootPart: "viewport",
    destroys: true,
  },
  parts: [
    {
      name: "viewport",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-viewport",
      forwardsRef: true,
      ownsRuntime: true,
      role: "region",
      initialAttributes: [
        { name: "data-position", source: "prop" },
        { name: "data-limit", source: "prop" },
        { name: "data-duration", source: "prop" },
        { name: "aria-live", source: "constant", value: "polite" },
        { name: "aria-atomic", source: "constant", value: "false" },
        { name: "aria-relevant", source: "constant", value: "additions text" },
        { name: "aria-label", source: "constant", value: "Notifications" },
        { name: "tabIndex", source: "constant", value: "-1" },
      ],
    },
    {
      name: "template",
      defaultElement: "template",
      discoveryAttribute: "data-sw-toast-template",
      forwardsRef: true,
    },
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-root",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-toast-id", source: "runtime" },
        { name: "data-state", source: "state" },
        { name: "data-variant", source: "prop" },
      ],
    },
    {
      name: "content",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-content",
      forwardsRef: true,
    },
    {
      name: "title",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-title",
      forwardsRef: true,
    },
    {
      name: "titleText",
      defaultElement: "span",
      discoveryAttribute: "data-sw-toast-title-text",
      forwardsRef: true,
    },
    {
      name: "description",
      defaultElement: "div",
      discoveryAttribute: "data-sw-toast-description",
      forwardsRef: true,
    },
    {
      name: "action",
      defaultElement: "button",
      discoveryAttribute: "data-sw-toast-action",
      forwardsRef: true,
      initialAttributes: [{ name: "type", source: "constant", value: "button" }],
    },
    {
      name: "close",
      defaultElement: "button",
      discoveryAttribute: "data-sw-toast-close",
      forwardsRef: true,
      initialAttributes: [
        { name: "type", source: "constant", value: "button" },
        { name: "aria-label", source: "constant", value: "Close notification" },
      ],
    },
  ],
  props: [
    { defaultValue: "5000", name: "duration", kind: "option", type: "number" },
    { defaultValue: '"0.5rem"', name: "gap", kind: "option", type: "string" },
    { defaultValue: "3", name: "limit", kind: "option", type: "number" },
    { defaultValue: '"1rem"', name: "peek", kind: "option", type: "string" },
    {
      defaultValue: '"bottom-right"',
      name: "position",
      kind: "option",
      type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
    },
    {
      defaultValue: '"default"',
      name: "variant",
      kind: "option",
      targets: ["template", "root"],
      type: '"default" | "error" | "info" | "loading" | "success" | "warning"',
    },
  ],
  presence: {
    initialHiddenParts: [],
    unmountPolicy: "runtime-owned",
  },
  refs: [
    { part: "viewport", public: true },
    { part: "template", public: true },
    { part: "root", public: true },
    { part: "action", public: true },
    { part: "close", public: true },
  ],
  initialMarkup: [
    {
      part: "viewport",
      attributes: [
        "role",
        "data-position",
        "data-limit",
        "data-duration",
        "aria-live",
        "aria-atomic",
        "aria-relevant",
        "aria-label",
        "tabIndex",
      ],
      reason: "The live region and manager configuration must be present before hydration.",
    },
    {
      part: "root",
      attributes: ["data-state", "data-variant"],
      reason: "Toast templates are cloned by the runtime and need the starting visual state.",
    },
    {
      part: "close",
      attributes: ["type", "aria-label"],
      reason: "Generated close controls need an accessible label in the cloned template.",
    },
  ],
  frameworkNotes: {
    astro: ["Generate static templates and a viewport self-init that installs the toast manager."],
    react: [
      "Generate template components plus a viewport effect that installs and destroys the toast manager.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "Global toast API, template cloning, timer management, update/promise lifecycle, stacking, and swipe dismissal remain runtime and component-template logic.",
      contractOwnedFacts: [
        "runtime bridge",
        "template and toast parts",
        "viewport configuration attributes",
        "template variant attribute",
      ],
      demotionCriteria:
        "Demote only if a future notification template renderer can model manager installation and cloned template updates generically.",
      reason:
        "Toast is a notification system rather than a single interactive DOM control, so generic primitive rendering would hide too much behavior.",
      tests: [
        "scripts/portable-runtime/tests/runtime-adapter-contract.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
