import type { StyledAdapterContract } from "../types.js";

export const accordionStyledContract: StyledAdapterContract = {
  component: "accordion",
  publicExports: ["Accordion", "AccordionContent", "AccordionItem", "AccordionTrigger"],
  defaultExport: {
    Root: "Accordion",
    Content: "AccordionContent",
    Item: "AccordionItem",
    Trigger: "AccordionTrigger",
  },
  variantCollectionName: "AccordionVariants",
  variants: {
    accordion: { base: "" },
    accordionContent: {
      base: [
        "transform-gpu overflow-hidden",
        "data-[state=closed]:animate-accordion-up data-[state=closed]:h-0",
        "data-[state=open]:animate-accordion-down",
      ],
    },
    accordionItem: { base: "not-last:border-b" },
    accordionTrigger: {
      base: [
        "flex w-full items-center justify-between gap-4 rounded-md py-4",
        "hover:text-muted-foreground text-left font-medium transition-all",
        "[&[data-state=open]>svg]:rotate-180",
        "focus-visible:border-outline focus-visible:ring-outline/50 outline-none focus-visible:ring-3",
        "disabled:pointer-events-none disabled:opacity-50",
      ],
    },
  },
  components: [
    {
      exportName: "Accordion",
      primitiveAliases: { accordion: "AccordionPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "type", optional: true, type: '"single" | "multiple"' },
          { name: "defaultValue", optional: true, type: "string | string[]" },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").AccordionValue',
            frameworks: ["react"],
          },
          { name: "collapsible", optional: true, type: "boolean" },
          {
            name: "onValueChange",
            optional: true,
            type: '(details: import("@starwind-ui/runtime").AccordionValueChangeDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "type", defaultValue: '"single"' },
          { name: "defaultValue" },
          { name: "value", frameworks: ["react"] },
          { name: "collapsible", defaultValue: "true" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "accordion",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "accordion",
                args: { class: "className" },
              },
            },
            { name: "type", value: { type: "variable", name: "type" } },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "value", value: { type: "variable", name: "value" }, frameworks: ["react"] },
            { name: "collapsible", value: { type: "variable", name: "collapsible" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "accordion" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AccordionItem",
      primitiveAliases: { accordion: "AccordionPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "value", type: "string" },
          { name: "disabled", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "value" },
          { name: "disabled", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "accordion",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "accordionItem",
                args: { class: "className" },
              },
            },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "accordion-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AccordionTrigger",
      primitiveAliases: { accordion: "AccordionPrimitive" },
      imports: [
        {
          type: "default",
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
        },
      ],
      props: { extends: [{ type: "htmlAttributes", element: "button" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "accordion",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "accordionTrigger",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "accordion-trigger" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronDown",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "literal",
                        value: "size-5 shrink-0 transition-transform duration-200",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "AccordionContent",
      primitiveAliases: { accordion: "AccordionPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "accordion",
          part: "Panel",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "accordionContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "accordion-content" } },
          ],
          children: [
            {
              type: "element",
              tag: "div",
              attrs: [{ name: "class", value: { type: "literal", value: "pt-0 pb-4" } }],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
  ],
};
