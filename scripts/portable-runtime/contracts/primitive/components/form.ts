import type { RuntimeAdapterContract } from "../types.js";

export const formRuntimeAdapterContract = {
  component: "form",
  category: "field-control-coordinator",
  displayName: "Form",
  runtime: {
    factory: "createForm",
    importSource: "@starwind-ui/runtime/form",
    rootPart: "root",
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "form",
      discoveryAttribute: "data-sw-form",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "form" },
        { name: "data-error-visibility", source: "prop" },
        { name: "data-revalidation-timing", source: "prop" },
        { name: "data-validation-timing", source: "prop" },
      ],
    },
    {
      name: "error-summary",
      defaultElement: "div",
      discoveryAttribute: "data-sw-form-error-summary",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-slot", source: "constant", value: "form-error-summary" },
        { name: "role", source: "constant", value: "status" },
        { name: "aria-live", source: "constant", value: "polite" },
        { name: "aria-atomic", source: "constant", value: "true" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    {
      name: "data-error-visibility",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
    {
      name: "data-revalidation-timing",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
    {
      name: "data-validation-timing",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
    { name: "errorVisibility", kind: "option", targets: ["root"], type: "FormValidationTiming" },
    { name: "revalidationTiming", kind: "option", targets: ["root"], type: "FormValidationTiming" },
    { name: "validationTiming", kind: "option", targets: ["root"], type: "FormValidationTiming" },
  ],
  refs: [
    { part: "root", public: true },
    { part: "error-summary", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-form",
        "data-slot",
        "data-error-visibility",
        "data-revalidation-timing",
        "data-validation-timing",
      ],
      reason:
        "Form must be discoverable before initialization so it can register nested Fields and preserve native form behavior.",
    },
    {
      part: "error-summary",
      attributes: [
        "data-sw-form-error-summary",
        "data-slot",
        "role",
        "aria-live",
        "aria-atomic",
        "hidden",
      ],
      reason:
        "Form error summaries start hidden, expose a public part identity, and provide a polite accessible live region before the runtime renders visible errors.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render a real form element and let the runtime register nested Fields without preventing valid native submission.",
    ],
    react: ["Create the Form runtime once for the real form element and clean it up on unmount."],
  },
} as const satisfies RuntimeAdapterContract;
