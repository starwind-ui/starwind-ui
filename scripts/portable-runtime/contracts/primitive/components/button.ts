import type { RuntimeAdapterContract } from "../types.js";

export const buttonRuntimeAdapterContract = {
  component: "button",
  category: "static-semantic",
  displayName: "Button",
  runtime: {
    factory: "createButton",
    importSource: "@starwind-ui/runtime/button",
    rootPart: "root",
    optionProps: ["disabled", "focusableWhenDisabled"],
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
  refs: [{ part: "root", public: true }],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-button", "type", "data-disabled", "aria-disabled"],
      reason: "The semantic button must be usable before the runtime controller attaches.",
    },
  ],
  frameworkNotes: {
    astro: ["Render static button markup and self-initialize the root script."],
    react: ["Create the controller in an effect and recreate when option props change."],
  },
} as const satisfies RuntimeAdapterContract;
