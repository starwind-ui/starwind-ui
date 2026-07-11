import type { StyledAdapterContract } from "../types.js";

export const popoverStyledContract: StyledAdapterContract = {
  component: "popover",
  publicExports: [
    "Popover",
    "PopoverContent",
    "PopoverDescription",
    "PopoverHeader",
    "PopoverTitle",
    "PopoverTrigger",
  ],
  defaultExport: {
    Root: "Popover",
    Trigger: "PopoverTrigger",
    Content: "PopoverContent",
    Header: "PopoverHeader",
    Title: "PopoverTitle",
    Description: "PopoverDescription",
  },
  variantCollectionName: "PopoverVariants",
  variants: {
    popover: { base: "" },
    popoverContent: {
      base: [
        "bg-popover text-popover-foreground z-50 flex w-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-lg border p-2.5 shadow-md",
        "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
        "origin-(--transform-origin) pointer-events-auto fixed isolate will-change-transform",
      ],
    },
    popoverDescription: { base: "text-muted-foreground" },
    popoverHeader: { base: "flex flex-col gap-1" },
    popoverTitle: { base: "font-medium" },
    popoverTrigger: {
      base: [
        "inline-flex items-center justify-center",
        "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
        "disabled:pointer-events-none",
      ],
    },
  },
  components: [
    {
      exportName: "Popover",
      primitiveAliases: { popover: "PopoverPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "openOnHover", optional: true, type: "boolean" },
          { name: "closeDelay", optional: true, type: "number" },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").PopoverOpenChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onCloseComplete",
            optional: true,
            type: '(details: import("@starwind-ui/runtime").PopoverCloseCompleteDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "modal", defaultValue: "false" },
          { name: "openOnHover", defaultValue: "false" },
          { name: "closeDelay", defaultValue: "200" },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "onCloseComplete", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "popover",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "popover",
                args: { class: "className" },
              },
            },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "closeOnEscape", value: { type: "variable", name: "closeOnEscape" } },
            {
              name: "closeOnOutsideInteract",
              value: { type: "variable", name: "closeOnOutsideInteract" },
            },
            { name: "modal", value: { type: "variable", name: "modal" } },
            { name: "openOnHover", value: { type: "variable", name: "openOnHover" } },
            { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
            {
              name: "onOpenChange",
              value: { type: "variable", name: "onOpenChange" },
              frameworks: ["react"],
            },
            {
              name: "onCloseComplete",
              value: { type: "variable", name: "onCloseComplete" },
              frameworks: ["react"],
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "popover" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PopoverTrigger",
      primitiveAliases: { popover: "PopoverPrimitive" },
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
          component: "popover",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "popoverTrigger",
                args: { class: "className" },
              },
            },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "popover-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PopoverContent",
      primitiveAliases: { popover: "PopoverPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' },
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "sideOffset", optional: true, type: "number" },
          { name: "avoidCollisions", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"center"' },
          { name: "sideOffset", defaultValue: "4" },
          { name: "avoidCollisions", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "popover",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "popover-portal" } }],
          children: [
            {
              type: "primitive",
              component: "popover",
              part: "Popup",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "popoverContent",
                    args: { class: "className" },
                  },
                },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "popover-content" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "PopoverHeader",
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "popoverHeader",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "popover-header" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PopoverTitle",
      primitiveAliases: { popover: "PopoverPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "h2" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "popover",
          part: "Title",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "popoverTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "popover-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PopoverDescription",
      primitiveAliases: { popover: "PopoverPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "p" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "popover",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "popoverDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "popover-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
