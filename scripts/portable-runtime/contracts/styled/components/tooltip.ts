import type { StyledAdapterContract } from "../types.js";

export const tooltipStyledContract: StyledAdapterContract = {
  component: "tooltip",
  publicExports: ["Tooltip", "TooltipContent", "TooltipTrigger"],
  defaultExport: {
    Root: "Tooltip",
    Trigger: "TooltipTrigger",
    Content: "TooltipContent",
  },
  variantCollectionName: "TooltipVariants",
  variants: {
    tooltip: { base: "inline-block" },
    tooltipContent: {
      base: [
        "group z-50 hidden w-fit px-3 py-1.5",
        "bg-foreground text-background rounded-md",
        "animate-in fade-in zoom-in-95 duration-150",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        "origin-(--transform-origin)",
      ],
    },
    tooltipCaret: {
      base: [
        "text-foreground absolute z-50 size-4",
        "[&>svg]:absolute [&>svg]:inset-0 [&>svg]:block [&>svg]:size-4 [&>svg]:fill-current",
        "group-data-[side=top]:bottom-0 group-data-[side=top]:left-1/2 group-data-[side=top]:-translate-x-1/2 group-data-[side=top]:translate-y-[calc(50%+1px)] group-data-[side=top]:rotate-180",
        "group-data-[side=bottom]:top-0 group-data-[side=bottom]:left-1/2 group-data-[side=bottom]:-translate-x-1/2 group-data-[side=bottom]:-translate-y-[calc(50%+1px)]",
        "group-data-[side=left]:top-1/2 group-data-[side=left]:right-0 group-data-[side=left]:translate-x-[calc(50%+1px)] group-data-[side=left]:-translate-y-1/2 group-data-[side=left]:rotate-90",
        "group-data-[side=right]:top-1/2 group-data-[side=right]:left-0 group-data-[side=right]:-translate-x-[calc(50%+1px)] group-data-[side=right]:-translate-y-1/2 group-data-[side=right]:-rotate-90",
      ],
    },
  },
  components: [
    {
      exportName: "Tooltip",
      primitiveAliases: { tooltip: "TooltipPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "disableHoverableContent", optional: true, type: "boolean" },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").TooltipOpenChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "openDelay", optional: true, type: "number" },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeDelay", defaultValue: "200" },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "disabled", defaultValue: "false" },
          { name: "disableHoverableContent", defaultValue: "false" },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "openDelay", defaultValue: "200" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tooltip",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "tooltip",
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
            { name: "disabled", value: { type: "variable", name: "disabled" } },
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
            { name: "data-slot", value: { type: "literal", value: "tooltip" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "TooltipTrigger",
      primitiveAliases: { tooltip: "TooltipPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "span" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLSpanElement | HTMLButtonElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "true" },
          { name: "disabled", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          frameworks: ["astro"],
          name: "triggerClassName",
          value: {
            type: "classJoin",
            items: [
              { type: "raw", code: 'asChild ? "contents" : "inline-flex"' },
              { type: "variable", name: "className" },
            ],
          },
        },
        {
          frameworks: ["react"],
          name: "triggerClassName",
          value: {
            type: "classJoin",
            items: [
              { type: "raw", code: 'asChild ? undefined : "inline-flex"' },
              { type: "variable", name: "className" },
            ],
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "tooltip",
          part: "Trigger",
          attrs: [
            { name: "class", value: { type: "variable", name: "triggerClassName" } },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "tooltip-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "TooltipContent",
      primitiveAliases: { tooltip: "TooltipPrimitive" },
      imports: [
        {
          importName: "CaretUp",
          source: "@tabler/icons/filled/caret-up.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "div",
            keys: ["tabindex", "tabIndex"],
          },
        ],
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
          { name: "side", defaultValue: '"top"' },
          { name: "align", defaultValue: '"center"' },
          { name: "sideOffset", defaultValue: "8" },
          { name: "avoidCollisions", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tooltip",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "tooltip-portal" } }],
          children: [
            {
              type: "primitive",
              component: "tooltip",
              part: "Positioner",
              attrs: [
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "class", value: { type: "literal", value: "isolate z-50" } },
                { name: "data-slot", value: { type: "literal", value: "tooltip-positioner" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "tooltip",
                  part: "Popup",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "tooltipContent",
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
                    { name: "data-slot", value: { type: "literal", value: "tooltip-content" } },
                  ],
                  children: [
                    { type: "slot", fallback: [{ type: "text", value: "My tooltip!" }] },
                    {
                      type: "primitive",
                      component: "tooltip",
                      part: "Arrow",
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "tooltipCaret" },
                        },
                        { name: "data-slot", value: { type: "literal", value: "tooltip-arrow" } },
                      ],
                      children: [
                        {
                          type: "slot",
                          name: "icon",
                          fallback: [{ type: "icon", attrs: [], importName: "CaretUp" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
