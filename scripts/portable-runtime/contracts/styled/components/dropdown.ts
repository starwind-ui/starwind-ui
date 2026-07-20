import type { StyledAdapterContract } from "../types.js";

export const dropdownStyledContract: StyledAdapterContract = {
  component: "dropdown",
  publicExports: [
    "Dropdown",
    "DropdownCheckboxItem",
    "DropdownCheckboxItemIndicator",
    "DropdownContent",
    "DropdownGroup",
    "DropdownItem",
    "DropdownLabel",
    "DropdownLinkItem",
    "DropdownRadioGroup",
    "DropdownRadioItem",
    "DropdownRadioItemIndicator",
    "DropdownSeparator",
    "DropdownShortcut",
    "DropdownSub",
    "DropdownSubContent",
    "DropdownSubTrigger",
    "DropdownTrigger",
  ],
  defaultExport: {
    Root: "Dropdown",
    Trigger: "DropdownTrigger",
    Content: "DropdownContent",
    CheckboxItem: "DropdownCheckboxItem",
    CheckboxItemIndicator: "DropdownCheckboxItemIndicator",
    RadioGroup: "DropdownRadioGroup",
    RadioItem: "DropdownRadioItem",
    RadioItemIndicator: "DropdownRadioItemIndicator",
    Item: "DropdownItem",
    LinkItem: "DropdownLinkItem",
    Group: "DropdownGroup",
    Label: "DropdownLabel",
    Separator: "DropdownSeparator",
    Shortcut: "DropdownShortcut",
    Sub: "DropdownSub",
    SubTrigger: "DropdownSubTrigger",
    SubContent: "DropdownSubContent",
  },
  variantCollectionName: "DropdownVariants",
  variants: {
    dropdown: { base: "relative" },
    dropdownCheckboxItem: {
      base: [
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
      ],
      variants: {
        inset: { true: "pl-8" },
        disabled: { true: "pointer-events-none opacity-50" },
      },
      defaultVariants: { inset: false, disabled: false },
    },
    dropdownCheckboxItemIndicator: {
      base: [
        "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
        "data-[state=checked]:opacity-100 data-visible:opacity-100 data-hidden:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    dropdownContent: {
      base: [
        "bg-popover text-popover-foreground z-50 min-w-[9rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
        "origin-(--transform-origin) pointer-events-auto fixed isolate will-change-transform",
      ],
    },
    dropdownItem: {
      base: [
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 transition-colors outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
      ],
      variants: {
        inset: { true: "pl-8" },
        disabled: { true: "pointer-events-none opacity-50" },
      },
      defaultVariants: { inset: false, disabled: false },
    },
    dropdownLabel: {
      base: ["text-muted-foreground px-2 py-1.5 text-sm font-medium"],
      variants: { inset: { true: "pl-8" } },
      defaultVariants: { inset: false },
    },
    dropdownRadioGroup: {
      base: "",
    },
    dropdownRadioItem: {
      base: [
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
      ],
      variants: {
        inset: { true: "pl-8" },
        disabled: { true: "pointer-events-none opacity-50" },
      },
      defaultVariants: { inset: false, disabled: false },
    },
    dropdownRadioItemIndicator: {
      base: [
        "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
        "data-[state=checked]:opacity-100 data-visible:opacity-100 data-hidden:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    dropdownSeparator: { base: "bg-border -mx-1 my-1 h-px" },
    dropdownShortcut: {
      base: [
        "group-data-highlighted/dropdown-item:text-accent-foreground group-focus/dropdown-item:text-accent-foreground group-hover/dropdown-item:text-accent-foreground text-muted-foreground ml-auto text-sm tracking-widest transition-colors",
      ],
    },
    dropdownTrigger: {
      base: [
        "inline-flex items-center justify-center",
        "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
        "disabled:pointer-events-none",
      ],
    },
  },
  components: [
    {
      exportName: "Dropdown",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "openOnHover", optional: true, type: "boolean" },
          { name: "closeDelay", optional: true, type: "number" },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").MenuOpenChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onCloseComplete",
            optional: true,
            type: '(details: import("@starwind-ui/runtime").MenuCloseCompleteDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "disabled", defaultValue: "false" },
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
          component: "menu",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdown",
                args: { class: "className" },
              },
            },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
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
            { name: "data-slot", value: { type: "literal", value: "dropdown" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownTrigger",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "triggerBaseClassName",
          value: {
            type: "classVariant",
            variant: "dropdownTrigger",
            args: { class: "className" },
          },
        },
        {
          name: "triggerClassName",
          value: {
            type: "raw",
            code: "asChild ? className : triggerBaseClassName",
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Trigger",
          attrs: [
            { name: "class", value: { type: "variable", name: "triggerClassName" } },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownContent",
      primitiveAliases: { menu: "MenuPrimitive" },
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
          { name: "align", defaultValue: '"start"' },
          { name: "sideOffset", defaultValue: "4" },
          { name: "avoidCollisions", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "dropdown-portal" } }],
          children: [
            {
              type: "primitive",
              component: "menu",
              part: "Popup",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "dropdownContent",
                    args: { class: "className" },
                  },
                },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "dropdown-content" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "DropdownItem",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "inset", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "inset", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownLinkItem",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "a" }],
        fields: [
          { name: "closeOnClick", optional: true, type: "boolean" },
          { name: "inset", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "closeOnClick", defaultValue: "false" },
          { name: "inset", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "LinkItem",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "closeOnClick", value: { type: "variable", name: "closeOnClick" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-link-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownCheckboxItem",
      primitiveAliases: { menu: "MenuPrimitive" },
      imports: [
        { importName: "Check", source: "@tabler/icons/outline/check.svg", type: "default" },
      ],
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "div", keys: ["aria-checked", "role"] }],
        fields: [
          { name: "checked", optional: true, type: "boolean" },
          { name: "defaultChecked", optional: true, type: "boolean" },
          { name: "closeOnClick", optional: true, type: "boolean" },
          { name: "inset", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "indicatorClass", optional: true, type: "string" },
          { name: "showIndicator", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "checked" },
          { name: "defaultChecked", defaultValue: "false" },
          { name: "closeOnClick", defaultValue: "false" },
          { name: "inset", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "indicatorClass", alias: "indicatorClassName" },
          { name: "showIndicator", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "CheckboxItem",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownCheckboxItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "checked", value: { type: "variable", name: "checked" } },
            { name: "defaultChecked", value: { type: "variable", name: "defaultChecked" } },
            { name: "closeOnClick", value: { type: "variable", name: "closeOnClick" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-checkbox-item" } },
          ],
          children: [
            {
              type: "conditional",
              condition: "showIndicator",
              then: [
                {
                  type: "primitive",
                  component: "menu",
                  part: "CheckboxItemIndicator",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "dropdownCheckboxItemIndicator",
                        args: { class: "indicatorClassName" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "dropdown-checkbox-item-indicator" },
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
            { type: "slot" },
          ],
        },
      ],
    },
    {
      exportName: "DropdownCheckboxItemIndicator",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "CheckboxItemIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownCheckboxItemIndicator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "data-slot",
              value: { type: "literal", value: "dropdown-checkbox-item-indicator" },
            },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownRadioGroup",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "value", optional: true, type: "string" },
          { name: "defaultValue", optional: true, type: "string" },
          {
            frameworks: ["react"],
            name: "onValueChange",
            optional: true,
            type: '(value: string, details: import("@starwind-ui/runtime").MenuValueChangeDetails) => void',
          },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "value" },
          { name: "defaultValue" },
          { frameworks: ["react"], name: "onValueChange" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "RadioGroup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownRadioGroup",
                args: { class: "className" },
              },
            },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            {
              frameworks: ["react"],
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-radio-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownRadioItem",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "div", keys: ["aria-checked", "role"] }],
        fields: [
          { name: "value", type: "string" },
          { name: "checked", optional: true, type: "boolean" },
          { name: "defaultChecked", optional: true, type: "boolean" },
          { name: "closeOnClick", optional: true, type: "boolean" },
          { name: "inset", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "indicatorClass", optional: true, type: "string" },
          { name: "showIndicator", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "value" },
          { name: "checked" },
          { name: "defaultChecked", defaultValue: "false" },
          { name: "closeOnClick", defaultValue: "false" },
          { name: "inset", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "indicatorClass", alias: "indicatorClassName" },
          { name: "showIndicator", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "RadioItem",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownRadioItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "checked", value: { type: "variable", name: "checked" } },
            { name: "defaultChecked", value: { type: "variable", name: "defaultChecked" } },
            { name: "closeOnClick", value: { type: "variable", name: "closeOnClick" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-radio-item" } },
          ],
          children: [
            {
              type: "conditional",
              condition: "showIndicator",
              then: [
                {
                  type: "primitive",
                  component: "menu",
                  part: "RadioItemIndicator",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "dropdownRadioItemIndicator",
                        args: { class: "indicatorClassName" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "dropdown-radio-item-indicator" },
                    },
                  ],
                  children: [
                    {
                      type: "slot",
                      name: "indicator",
                      fallback: [
                        {
                          type: "element",
                          tag: "span",
                          attrs: [
                            {
                              name: "class",
                              value: { type: "literal", value: "size-2 rounded-full bg-current" },
                            },
                          ],
                          selfClosing: true,
                        },
                      ],
                    },
                  ],
                },
              ],
              else: [],
            },
            { type: "slot" },
          ],
        },
      ],
    },
    {
      exportName: "DropdownRadioItemIndicator",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "RadioItemIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownRadioItemIndicator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "data-slot",
              value: { type: "literal", value: "dropdown-radio-item-indicator" },
            },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownGroup",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Group",
          attrs: [
            { name: "class", value: { type: "variable", name: "className" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownLabel",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [{ name: "inset", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "inset", defaultValue: "false" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Label",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownLabel",
                args: { inset: "inset", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownSeparator",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Separator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-separator" } },
          ],
        },
      ],
    },
    {
      exportName: "DropdownShortcut",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Shortcut",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownShortcut",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-shortcut" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownSub",
      primitiveAliases: { menu: "MenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [{ name: "closeDelay", optional: true, type: "number" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "closeDelay", defaultValue: "200" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "SubmenuRoot",
          attrs: [
            {
              name: "class",
              value: {
                type: "classJoin",
                items: [
                  { type: "literal", value: "relative" },
                  { type: "variable", name: "className" },
                ],
              },
            },
            { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-sub" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DropdownSubTrigger",
      primitiveAliases: { menu: "MenuPrimitive" },
      imports: [
        {
          importName: "ChevronRight",
          source: "@tabler/icons/outline/chevron-right.svg",
          type: "default",
        },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "inset", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "inset", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "subTriggerClassName",
          value: {
            type: "raw",
            code: "className",
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "SubmenuTrigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dropdownItem",
                args: { inset: "inset", disabled: "disabled", class: "subTriggerClassName" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dropdown-sub-trigger" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "icon",
              importName: "ChevronRight",
              attrs: [{ name: "class", value: { type: "literal", value: "ml-auto size-4" } }],
            },
          ],
        },
      ],
    },
    {
      exportName: "DropdownSubContent",
      primitiveAliases: { menu: "MenuPrimitive" },
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
          { name: "side", defaultValue: '"right"' },
          { name: "align", defaultValue: '"start"' },
          { name: "sideOffset", defaultValue: "0" },
          { name: "avoidCollisions", defaultValue: "true" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "subContentClassName",
          value: {
            type: "raw",
            code: "className",
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "menu",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "dropdown-sub-portal" } }],
          children: [
            {
              type: "primitive",
              component: "menu",
              part: "Popup",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "dropdownContent",
                    args: { class: "subContentClassName" },
                  },
                },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "data-slot",
                  value: { type: "literal", value: "dropdown-sub-content" },
                },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
  ],
};
