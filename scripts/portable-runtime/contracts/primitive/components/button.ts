import type { RuntimeAdapterContract } from "../types.js";

export const buttonRuntimeAdapterContract = {
  component: "button",
  category: "static-semantic",
  displayName: "Button",
  runtime: {
    factory: "createButton",
    importSource: "@starwind-ui/runtime/button",
    rootPart: "root",
    optionProps: ["disabled"],
    optionPropLifecycles: { disabled: "setter-backed" },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "button",
      discoveryAttribute: "data-sw-button",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [
        { name: "type", source: "prop" },
        { name: "data-focusable-when-disabled", source: "prop" },
        { name: "data-disabled", source: "prop" },
        { name: "aria-disabled", source: "prop" },
      ],
    },
  ],
  props: [
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    {
      defaultValue: "false",
      name: "focusableWhenDisabled",
      kind: "option",
      type: "boolean",
    },
    { name: "type", kind: "attribute", targets: ["root"], type: "button | submit | reset" },
  ],
  setters: [{ method: "setDisabled", prop: "disabled" }],
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-button",
        "data-focusable-when-disabled",
        "type",
        "data-disabled",
        "aria-disabled",
      ],
      reason:
        "Native button markup owns ordinary behavior; the focusable-disabled attribute conditionally opts the root into Runtime.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Initialize only focusable-disabled roots and bridge later scoped initialization through setDisabled.",
    ],
    react: [
      "Create and destroy with focusableWhenDisabled changes; bridge disabled changes through setDisabled.",
    ],
  },
} as const satisfies RuntimeAdapterContract;
