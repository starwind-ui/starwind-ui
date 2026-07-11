import type { RuntimeAdapterContract } from "../types.js";

export const fieldsetRuntimeAdapterContract = {
  component: "fieldset",
  category: "field-control-coordinator",
  displayName: "Fieldset",
  runtime: {
    factory: "createFieldset",
    importSource: "@starwind-ui/runtime/fieldset",
    rootPart: "root",
    optionProps: ["disabled"],
    optionPropLifecycles: { disabled: "setter-backed" },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "fieldset",
      discoveryAttribute: "data-sw-fieldset",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [{ name: "data-disabled", source: "prop" }],
    },
    {
      name: "legend",
      defaultElement: "div",
      discoveryAttribute: "data-sw-fieldset-legend",
      forwardsRef: true,
    },
  ],
  props: [{ defaultValue: "false", name: "disabled", kind: "option", type: "boolean" }],
  setters: [{ method: "setDisabled", prop: "disabled" }],
  refs: [
    { part: "root", public: true },
    { part: "legend", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-fieldset", "data-disabled"],
      reason:
        "Fieldsets must expose disabled grouping state before initialization so child Fields can inherit it.",
    },
    {
      part: "legend",
      attributes: ["data-sw-fieldset-legend"],
      reason:
        "The Fieldset controller associates legend ids with the root and then mirrors disabled state for styling.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render native fieldset markup and let the runtime associate legends and child fields.",
    ],
    react: [
      "Bridge disabled updates through the Fieldset setter without recreating the controller.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The generic primitive templates own this component fully; styling and shadcn-compatible composition pieces belong to the styled Field contract.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root and legend parts",
        "native fieldset semantics",
        "legend-to-group association",
        "disabled option and setter",
        "child Field disabled inheritance",
        "initial root and legend attributes",
      ],
      demotionCriteria:
        "Remove only if Fieldset becomes purely static markup with no runtime-disabled propagation.",
      reason:
        "Fieldset is intentionally tiny, but disabled inheritance across custom Field controls requires a runtime coordinator.",
      tests: [
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
