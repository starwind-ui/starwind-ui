import type { StyledAdapterContract } from "../types.js";

export const hoverCardStyledContract: StyledAdapterContract = {
  component: "hover-card",
  publicExports: ["HoverCard", "HoverCardContent", "HoverCardTrigger"],
  defaultExport: {
    Root: "HoverCard",
    Trigger: "HoverCardTrigger",
    Content: "HoverCardContent",
  },
  variantCollectionName: "HoverCardVariants",
  variants: {
    hoverCard: { base: "inline-block" },
    hoverCardContent: {
      base: [
        "bg-popover text-popover-foreground z-50 hidden w-64 rounded-lg border p-3 shadow-md outline-hidden duration-100",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        "origin-(--transform-origin)",
      ],
    },
    hoverCardTrigger: {
      base: [
        "inline-flex items-center justify-center",
        "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
        "disabled:pointer-events-none",
      ],
    },
  },
  components: [
    {
      exportName: "HoverCard",
      primitiveAliases: { "preview-card": "PreviewCardPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "disableHoverableContent", optional: true, type: "boolean" },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").PreviewCardOpenChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "openDelay", optional: true, type: "number" },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeDelay", defaultValue: "300" },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "disableHoverableContent", defaultValue: "false" },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "openDelay", defaultValue: "600" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "preview-card",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "hoverCard",
                args: { class: "className" },
              },
            },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
            { name: "closeOnEscape", value: { type: "variable", name: "closeOnEscape" } },
            {
              name: "closeOnOutsideInteract",
              value: { type: "variable", name: "closeOnOutsideInteract" },
            },
            {
              name: "disableHoverableContent",
              value: { type: "variable", name: "disableHoverableContent" },
            },
            {
              name: "onOpenChange",
              value: { type: "variable", name: "onOpenChange" },
              frameworks: ["react"],
            },
            { name: "openDelay", value: { type: "variable", name: "openDelay" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "hover-card" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "HoverCardTrigger",
      primitiveAliases: { "preview-card": "PreviewCardPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "a" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "openDelay", optional: true, type: "number" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "closeDelay" },
          { name: "disabled", defaultValue: "false" },
          { name: "openDelay" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "preview-card",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "hoverCardTrigger",
                args: { class: "className" },
              },
            },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "openDelay", value: { type: "variable", name: "openDelay" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "hover-card-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "HoverCardContent",
      primitiveAliases: { "preview-card": "PreviewCardPrimitive" },
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
          component: "preview-card",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "hover-card-portal" } }],
          children: [
            {
              type: "primitive",
              component: "preview-card",
              part: "Positioner",
              attrs: [
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "class", value: { type: "literal", value: "isolate z-50" } },
                { name: "data-slot", value: { type: "literal", value: "hover-card-positioner" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "preview-card",
                  part: "Popup",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "hoverCardContent",
                        args: { class: "className" },
                      },
                    },
                    { name: "side", value: { type: "variable", name: "side" } },
                    { name: "align", value: { type: "variable", name: "align" } },
                    { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                    {
                      name: "avoidCollisions",
                      value: { type: "variable", name: "avoidCollisions" },
                    },
                    { name: "spread", value: { type: "variable", name: "rest" } },
                    { name: "data-slot", value: { type: "literal", value: "hover-card-content" } },
                  ],
                  children: [{ type: "slot" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
