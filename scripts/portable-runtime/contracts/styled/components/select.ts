import type { StyledAdapterContract } from "../types.js";

export const selectStyledContract: StyledAdapterContract = {
  component: "select",
  publicExports: [
    "Select",
    "SelectContent",
    "SelectGroup",
    "SelectItem",
    "SelectItemIndicator",
    "SelectItemText",
    "SelectLabel",
    "SelectScrollDownButton",
    "SelectScrollUpButton",
    "SelectSeparator",
    "SelectTrigger",
    "SelectValue",
  ],
  defaultExport: {
    Root: "Select",
    Trigger: "SelectTrigger",
    Value: "SelectValue",
    Content: "SelectContent",
    Group: "SelectGroup",
    Label: "SelectLabel",
    Item: "SelectItem",
    ItemText: "SelectItemText",
    ItemIndicator: "SelectItemIndicator",
    Separator: "SelectSeparator",
    ScrollUpButton: "SelectScrollUpButton",
    ScrollDownButton: "SelectScrollDownButton",
  },
  variantCollectionName: "SelectVariants",
  variants: {
    select: { base: "relative" },
    selectContent: {
      base: [
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
        "data-[align-trigger=true]:!animate-none",
        "origin-(--transform-origin) pointer-events-auto fixed isolate w-(--anchor-width) will-change-transform",
      ],
      variants: {
        size: {
          sm: "text-sm [&_[data-slot=select-label]]:text-xs",
          md: "text-base [&_[data-slot=select-label]]:text-sm",
          lg: "text-lg [&_[data-slot=select-label]]:text-base",
        },
      },
      defaultVariants: { size: "md" },
    },
    selectGroup: { base: "" },
    selectItem: {
      base: [
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "group/select-item [&>svg]:size-4 [&>svg]:shrink-0",
      ],
      variants: {
        inset: { true: "pl-8" },
        disabled: { true: "pointer-events-none opacity-50" },
      },
      defaultVariants: { inset: false, disabled: false },
    },
    selectItemIndicator: {
      base: [
        "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
        "data-[state=checked]:opacity-100 data-visible:opacity-100 data-hidden:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    selectItemText: { base: "flex flex-1 shrink-0 gap-2 whitespace-nowrap" },
    selectLabel: { base: "text-muted-foreground px-2 py-1.5 font-medium" },
    selectList: { base: "max-h-96 overflow-x-hidden overflow-y-auto p-1" },
    selectScrollButton: {
      base: "bg-popover text-muted-foreground flex w-full cursor-default items-center justify-center py-1 [&>svg]:size-4",
    },
    selectSeparator: { base: "bg-border -mx-1 my-1 h-px" },
    selectTrigger: {
      base: [
        "border-input dark:bg-input/30 text-foreground ring-offset-background flex items-center justify-between gap-2 rounded-md border bg-transparent shadow-xs select-none",
        "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:transition-none focus-visible:ring-3",
        "disabled:cursor-not-allowed disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-placeholder:text-muted-foreground [&_[data-slot=select-value]]:line-clamp-1 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
      ],
      variants: {
        size: {
          sm: "h-9 px-2 text-sm",
          md: "h-11 px-3 text-base",
          lg: "h-12 px-4 text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
    selectValue: { base: "pointer-events-none flex flex-1 text-left" },
  },
  components: [
    {
      exportName: "Select",
      primitiveAliases: { select: "SelectPrimitive" },
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["defaultValue", "onChange"] },
        ],
        fields: [
          { name: "autoComplete", optional: true, type: "string" },
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "defaultValue", optional: true, type: "string | null" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "highlightItemOnHover", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "name", optional: true, type: "string" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "readOnly", optional: true, type: "boolean" },
          { name: "required", optional: true, type: "boolean" },
          { name: "value", optional: true, type: "string | null", frameworks: ["react"] },
          {
            frameworks: ["react"],
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").SelectOpenChangeDetails) => void',
          },
          {
            frameworks: ["react"],
            name: "onValueChange",
            optional: true,
            type: '(value: string | null, details: import("@starwind-ui/runtime").SelectValueChangeDetails) => void',
          },
        ],
      },
      destructure: {
        props: [
          { name: "autoComplete" },
          { name: "defaultOpen", defaultValue: "false" },
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "highlightItemOnHover", defaultValue: "true" },
          { name: "modal", defaultValue: "true" },
          { name: "name" },
          { name: "open", frameworks: ["react"] },
          { name: "readOnly", defaultValue: "false" },
          { name: "required", defaultValue: "false" },
          { name: "value", frameworks: ["react"] },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "select", args: { class: "className" } },
            },
            { name: "autoComplete", value: { type: "variable", name: "autoComplete" } },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "form", value: { type: "variable", name: "form" } },
            {
              name: "highlightItemOnHover",
              value: { type: "variable", name: "highlightItemOnHover" },
            },
            { name: "modal", value: { type: "variable", name: "modal" } },
            { name: "name", value: { type: "variable", name: "name" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "readOnly", value: { type: "variable", name: "readOnly" } },
            { name: "required", value: { type: "variable", name: "required" } },
            { name: "value", value: { type: "variable", name: "value" }, frameworks: ["react"] },
            {
              frameworks: ["react"],
              name: "onOpenChange",
              value: { type: "variable", name: "onOpenChange" },
            },
            {
              frameworks: ["react"],
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectTrigger",
      primitiveAliases: { select: "SelectPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          { type: "htmlAttributes", element: "button" },
          { type: "variantProps", variant: "selectTrigger" },
        ],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "iconClass", optional: true, type: "string" },
          { name: "placeholder", optional: true, type: "string" },
          { name: "showIcon", optional: true, type: "boolean" },
          { name: "valueClass", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "class", alias: "className" },
          { name: "iconClass", alias: "iconClassName" },
          { name: "placeholder" },
          { name: "showIcon", defaultValue: "true" },
          { name: "size", defaultValue: '"md"' },
          { name: "valueClass", alias: "valueClassName" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectTrigger",
                args: { size: "size", class: "className" },
              },
            },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-trigger" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "primitive",
                  component: "select",
                  part: "Value",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "selectValue",
                        args: { class: "valueClassName" },
                      },
                    },
                    { name: "placeholder", value: { type: "variable", name: "placeholder" } },
                    { name: "data-slot", value: { type: "literal", value: "select-value" } },
                  ],
                },
              ],
            },
            {
              type: "conditional",
              condition: "!asChild && showIcon",
              then: [
                {
                  type: "primitive",
                  component: "select",
                  part: "Icon",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classJoin",
                        items: [
                          {
                            type: "literal",
                            value: "text-muted-foreground pointer-events-none size-4",
                          },
                          { type: "variable", name: "iconClassName" },
                        ],
                      },
                    },
                    { name: "data-slot", value: { type: "literal", value: "select-icon" } },
                  ],
                  children: [
                    {
                      type: "slot",
                      name: "icon",
                      fallback: [{ type: "icon", importName: "ChevronDown" }],
                    },
                  ],
                },
              ],
              else: [],
            },
          ],
        },
      ],
    },
    {
      exportName: "SelectValue",
      primitiveAliases: { select: "SelectPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "span" }],
        fields: [{ name: "placeholder", optional: true, type: "string" }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }, { name: "placeholder" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Value",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectValue",
                args: { class: "className" },
              },
            },
            { name: "placeholder", value: { type: "variable", name: "placeholder" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-value" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectContent",
      primitiveAliases: { select: "SelectPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "alignOffset", optional: true, type: "number" },
          { name: "alignItemWithTrigger", optional: true, type: "boolean" },
          { name: "avoidCollisions", optional: true, type: "boolean" },
          { name: "keepMounted", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' },
          { name: "sideOffset", optional: true, type: "number" },
          { name: "size", optional: true, type: '"sm" | "md" | "lg"' },
        ],
      },
      destructure: {
        props: [
          { name: "align", defaultValue: '"start"' },
          { name: "alignOffset", defaultValue: "0" },
          { name: "alignItemWithTrigger", defaultValue: "true" },
          { name: "avoidCollisions", defaultValue: "true" },
          { name: "class", alias: "className" },
          { name: "keepMounted", defaultValue: "false", frameworks: ["react"] },
          { name: "side", defaultValue: '"bottom"' },
          { name: "sideOffset", defaultValue: "4" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "select-portal" } }],
          children: [
            {
              type: "primitive",
              component: "select",
              part: "Positioner",
              attrs: [
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "alignOffset", value: { type: "variable", name: "alignOffset" } },
                {
                  name: "alignItemWithTrigger",
                  value: { type: "variable", name: "alignItemWithTrigger" },
                },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "data-slot", value: { type: "literal", value: "select-positioner" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "select",
                  part: "Popup",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "selectContent",
                        args: { size: "size", class: "className" },
                      },
                    },
                    { name: "align", value: { type: "variable", name: "align" } },
                    { name: "alignOffset", value: { type: "variable", name: "alignOffset" } },
                    {
                      name: "avoidCollisions",
                      value: { type: "variable", name: "avoidCollisions" },
                    },
                    {
                      name: "keepMounted",
                      value: { type: "variable", name: "keepMounted" },
                      frameworks: ["react"],
                    },
                    { name: "side", value: { type: "variable", name: "side" } },
                    { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                    {
                      name: "data-align-trigger",
                      value: {
                        type: "raw",
                        code: 'alignItemWithTrigger ? "true" : "false"',
                      },
                    },
                    { name: "spread", value: { type: "variable", name: "rest" } },
                    { name: "data-slot", value: { type: "literal", value: "select-content" } },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "select",
                      part: "List",
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "selectList", args: {} },
                        },
                        { name: "data-slot", value: { type: "literal", value: "select-list" } },
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
    },
    {
      exportName: "SelectItem",
      primitiveAliases: { select: "SelectPrimitive" },
      imports: [
        { importName: "Check", source: "@tabler/icons/outline/check.svg", type: "default" },
      ],
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["role"] },
          { type: "variantProps", variant: "selectItem" },
        ],
        fields: [
          { name: "disabled", optional: true, type: "boolean" },
          { name: "indicatorClass", optional: true, type: "string" },
          { name: "showIndicator", optional: true, type: "boolean" },
          { name: "value", type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "disabled", defaultValue: "false" },
          { name: "indicatorClass", alias: "indicatorClassName" },
          { name: "inset", defaultValue: "false" },
          { name: "showIndicator", defaultValue: "true" },
          { name: "value" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-item" } },
          ],
          children: [
            {
              type: "primitive",
              component: "select",
              part: "ItemText",
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "selectItemText", args: {} },
                },
                { name: "data-slot", value: { type: "literal", value: "select-item-text" } },
              ],
              children: [{ type: "slot" }],
            },
            {
              type: "conditional",
              condition: "showIndicator",
              then: [
                {
                  type: "primitive",
                  component: "select",
                  part: "ItemIndicator",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "selectItemIndicator",
                        args: { class: "indicatorClassName" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "select-item-indicator" },
                    },
                  ],
                  children: [
                    {
                      type: "slot",
                      name: "indicator",
                      fallback: [
                        {
                          type: "icon",
                          importName: "Check",
                          attrs: [{ name: "class", value: { type: "literal", value: "size-4" } }],
                        },
                      ],
                    },
                  ],
                },
              ],
              else: [],
            },
          ],
        },
      ],
    },
    {
      exportName: "SelectItemText",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "ItemText",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectItemText",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-item-text" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectItemIndicator",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "ItemIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectItemIndicator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-item-indicator" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectGroup",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Group",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "selectGroup", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectLabel",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "GroupLabel",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "selectLabel", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectSeparator",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "Separator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-separator" } },
          ],
        },
      ],
    },
    {
      exportName: "SelectScrollUpButton",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "ScrollUpArrow",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectScrollButton",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-scroll-up-button" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SelectScrollDownButton",
      primitiveAliases: { select: "SelectPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "select",
          part: "ScrollDownArrow",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "selectScrollButton",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "select-scroll-down-button" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
