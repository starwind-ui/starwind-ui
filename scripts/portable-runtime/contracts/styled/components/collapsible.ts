import type { StyledAdapterContract } from "../types.js";

export const collapsibleStyledContract: StyledAdapterContract = {
  component: "collapsible",
  publicExports: ["Collapsible", "CollapsibleContent", "CollapsibleTrigger"],
  defaultExport: {
    Root: "Collapsible",
    Content: "CollapsibleContent",
    Trigger: "CollapsibleTrigger",
  },
  variantCollectionName: "CollapsibleVariants",
  variants: {
    collapsible: { base: "" },
    collapsibleContent: { base: "" },
    collapsibleTrigger: { base: "" },
  },
  components: [
    {
      exportName: "Collapsible",
      primitiveAliases: { collapsible: "CollapsiblePrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").CollapsibleOpenChangeDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "collapsible",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "collapsible",
                args: { class: "className" },
              },
            },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            {
              name: "onOpenChange",
              value: { type: "variable", name: "onOpenChange" },
              frameworks: ["react"],
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "collapsible" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CollapsibleTrigger",
      primitiveAliases: { collapsible: "CollapsiblePrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [{ name: "asChild", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "collapsible",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "collapsibleTrigger",
                args: { class: "className" },
              },
            },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "collapsible-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CollapsibleContent",
      primitiveAliases: { collapsible: "CollapsiblePrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "collapsible",
          part: "Panel",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "collapsibleContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "collapsible-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
