import type { RuntimeAdapterContract } from "../types.js";

/** Reactive Form inputs. Astro configures these through createForm in client code. */
export const formReactiveProps = [
  {
    name: "options",
    type: "FormOptions",
    kind: "option",
    targets: ["root"],
    unsupportedTargets: ["astro"],
  },
  {
    name: "errors",
    type: "FormExternalErrors",
    kind: "option",
    targets: ["root"],
    unsupportedTargets: ["astro"],
  },
  {
    name: "errorOptions",
    type: "FormExternalErrorOptions",
    kind: "option",
    targets: ["root"],
    unsupportedTargets: ["astro"],
  },
] satisfies RuntimeAdapterContract["props"];

/** Replacing options resets omitted settings to Runtime defaults. */
export const formOptionDefaults = {
  fieldValidators: undefined,
  formValidators: undefined,
  asyncFieldValidators: undefined,
  asyncFormValidators: undefined,
  asyncValidationDebounceMs: undefined,
  externalErrorsOnReset: undefined,
  onSubmit: undefined,
} as const;

const reactiveFormNotes = [
  "Create one controller for the native form. Apply options before errors after connection. Watch prop replacement without deep traversal; each input has its own update lifetime.",
  "Replacing options resets omitted keys to Runtime defaults. Replacing errors replaces the complete error map; removing a previously supplied input clears it. Omitted inputs preserve imperative setup.",
  "Keep the public ref on HTMLFormElement; retrieve the imperative controller with createForm(element). Runtime owns all validation and submission behavior.",
];

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
    ...formReactiveProps,

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
    {
      defaultValue: "submit",
      name: "errorVisibility",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
    {
      defaultValue: "change",
      name: "revalidationTiming",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
    {
      defaultValue: "submit",
      name: "validationTiming",
      kind: "option",
      targets: ["root"],
      type: "FormValidationTiming",
    },
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
      "Retrieve the idempotent imperative controller with createForm(element); the component does not expose a controller ref.",
    ],
    react: reactiveFormNotes,
    vue: reactiveFormNotes,
    svelte: reactiveFormNotes,
  },
} as const satisfies RuntimeAdapterContract;
