import type { StyledAdapterContract } from "../types.js";

export const comboboxStyledContract: StyledAdapterContract = {
  component: "combobox",
  publicExports: [
    "Combobox",
    "ComboboxClear",
    "ComboboxContent",
    "ComboboxEmpty",
    "ComboboxGroup",
    "ComboboxGroupLabel",
    "ComboboxInput",
    "ComboboxInputGroup",
    "ComboboxItem",
    "ComboboxItemIndicator",
    "ComboboxItemText",
    "ComboboxLabel",
    "ComboboxSeparator",
    "ComboboxTrigger",
    "ComboboxValue",
  ],
  defaultExport: {
    Root: "Combobox",
    Label: "ComboboxLabel",
    InputGroup: "ComboboxInputGroup",
    Input: "ComboboxInput",
    Trigger: "ComboboxTrigger",
    Clear: "ComboboxClear",
    Value: "ComboboxValue",
    Content: "ComboboxContent",
    Empty: "ComboboxEmpty",
    Group: "ComboboxGroup",
    GroupLabel: "ComboboxGroupLabel",
    Item: "ComboboxItem",
    ItemText: "ComboboxItemText",
    ItemIndicator: "ComboboxItemIndicator",
    Separator: "ComboboxSeparator",
  },
  variantCollectionName: "ComboboxVariants",
  variants: {
    combobox: { base: "relative" },
    comboboxClear: {
      base: [
        "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center justify-center rounded-sm transition-colors outline-none",
        "focus-visible:ring-outline/50 focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    comboboxContent: {
      base: [
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
        "origin-(--transform-origin) pointer-events-auto fixed isolate w-(--anchor-width) will-change-transform",
      ],
      variants: {
        size: {
          sm: "text-sm [&_[data-slot=combobox-group-label]]:text-xs",
          md: "text-base [&_[data-slot=combobox-group-label]]:text-sm",
          lg: "text-lg [&_[data-slot=combobox-group-label]]:text-base",
        },
      },
      defaultVariants: { size: "md" },
    },
    comboboxEmpty: {
      base: "text-muted-foreground px-3 py-6 text-center text-sm",
    },
    comboboxGroup: { base: "" },
    comboboxGroupLabel: { base: "text-muted-foreground px-2 py-1.5 font-medium" },
    comboboxInput: {
      base: [
        "placeholder:text-muted-foreground text-foreground flex h-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent py-1 pr-1 pl-3 shadow-none outline-none ring-0",
        "focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-error-visible:text-error data-error-visible:ring-0",
      ],
    },
    comboboxInputGroup: {
      base: [
        "w-auto transition-[color,box-shadow] focus-within:border-outline focus-within:ring-outline/50 focus-within:transition-none focus-within:ring-3",
        "has-[[data-slot=combobox-input][data-error-visible]]:border-error has-[[data-slot=combobox-input][data-error-visible]]:ring-error/40",
        "[&>[data-align=inline-end]:has(>div>button)]:mr-[-0.3rem]",
      ],
      variants: {
        size: {
          sm: "h-9 text-sm [&_[data-slot=combobox-input]]:text-sm",
          md: "h-11 text-base [&_[data-slot=combobox-input]]:text-base",
          lg: "h-12 text-lg [&_[data-slot=combobox-input]]:text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
    comboboxItem: {
      base: [
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "group/combobox-item [&>svg]:size-4 [&>svg]:shrink-0",
      ],
      variants: {
        inset: { true: "pl-8" },
        disabled: { true: "pointer-events-none opacity-50" },
      },
      defaultVariants: { inset: false, disabled: false },
    },
    comboboxItemIndicator: {
      base: [
        "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
        "data-[state=checked]:opacity-100 data-visible:opacity-100 data-hidden:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    comboboxItemText: { base: "flex flex-1 shrink-0 gap-2 whitespace-nowrap" },
    comboboxLabel: { base: "text-foreground text-sm font-medium" },
    comboboxList: { base: "max-h-96 overflow-x-hidden overflow-y-auto p-1" },
    comboboxSeparator: { base: "bg-border -mx-1 my-1 h-px" },
    comboboxTrigger: {
      base: [
        "text-muted-foreground transition-[color,box-shadow] outline-none",
        "focus-visible:ring-outline/50 focus-visible:transition-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      ],
    },
    comboboxValue: { base: "text-muted-foreground text-sm" },
  },
  components: [
    {
      exportName: "Combobox",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["defaultValue", "onChange"] },
        ],
        fields: [
          { name: "autoComplete", optional: true, type: "string" },
          { name: "defaultInputValue", optional: true, type: "string" },
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "defaultValue", optional: true, type: "string | null" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "filterMode", optional: true, type: '"contains" | "startsWith"' },
          { name: "form", optional: true, type: "string" },
          { name: "highlightItemOnHover", optional: true, type: "boolean" },
          { name: "inputValue", optional: true, type: "string", frameworks: ["react"] },
          { name: "locale", optional: true, type: "string" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "name", optional: true, type: "string" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "readOnly", optional: true, type: "boolean" },
          { name: "required", optional: true, type: "boolean" },
          { name: "value", optional: true, type: "string | null", frameworks: ["react"] },
          {
            frameworks: ["react"],
            name: "onInputValueChange",
            optional: true,
            type: '(inputValue: string, details: import("@starwind-ui/runtime").ComboboxInputValueChangeDetails) => void',
          },
          {
            frameworks: ["react"],
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").ComboboxOpenChangeDetails) => void',
          },
          {
            frameworks: ["react"],
            name: "onValueChange",
            optional: true,
            type: '(value: string | null, details: import("@starwind-ui/runtime").ComboboxValueChangeDetails) => void',
          },
        ],
      },
      destructure: {
        props: [
          { name: "autoComplete" },
          { name: "defaultInputValue" },
          { name: "defaultOpen", defaultValue: "false" },
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "filterMode", defaultValue: '"contains"' },
          { name: "form" },
          { name: "highlightItemOnHover", defaultValue: "true" },
          { name: "inputValue", frameworks: ["react"] },
          { name: "locale" },
          { name: "modal", defaultValue: "false" },
          { name: "name" },
          { name: "open", frameworks: ["react"] },
          { name: "readOnly", defaultValue: "false" },
          { name: "required", defaultValue: "false" },
          { name: "value", frameworks: ["react"] },
          { name: "onInputValueChange", frameworks: ["react"] },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "combobox", args: { class: "className" } },
            },
            { name: "autoComplete", value: { type: "variable", name: "autoComplete" } },
            { name: "defaultInputValue", value: { type: "variable", name: "defaultInputValue" } },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "filterMode", value: { type: "variable", name: "filterMode" } },
            { name: "form", value: { type: "variable", name: "form" } },
            {
              name: "highlightItemOnHover",
              value: { type: "variable", name: "highlightItemOnHover" },
            },
            {
              name: "inputValue",
              value: { type: "variable", name: "inputValue" },
              frameworks: ["react"],
            },
            { name: "locale", value: { type: "variable", name: "locale" } },
            { name: "modal", value: { type: "variable", name: "modal" } },
            { name: "name", value: { type: "variable", name: "name" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "readOnly", value: { type: "variable", name: "readOnly" } },
            { name: "required", value: { type: "variable", name: "required" } },
            { name: "value", value: { type: "variable", name: "value" }, frameworks: ["react"] },
            {
              frameworks: ["react"],
              name: "onInputValueChange",
              value: { type: "variable", name: "onInputValueChange" },
            },
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
            { name: "data-slot", value: { type: "literal", value: "combobox" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxLabel",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Label",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxLabel",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxInputGroup",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "comboboxInputGroup" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "input-group",
          exportName: "InputGroup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxInputGroup",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-sw-combobox-input-group", value: { type: "literal", value: "" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-input-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxInput",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
        { importName: "X", source: "@tabler/icons/outline/x.svg", type: "default" },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "input" }],
        fields: [
          { name: "children", optional: true, type: "React.ReactNode", frameworks: ["react"] },
          { name: "showClear", optional: true, type: "boolean" },
          { name: "showTrigger", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "disabled", defaultValue: "false" },
          { name: "showClear", defaultValue: "false" },
          { name: "showTrigger", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "input-group",
          exportName: "InputGroup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxInputGroup",
                args: { class: "className" },
              },
            },
            { name: "data-sw-combobox-input-group", value: { type: "literal", value: "" } },
          ],
          children: [
            {
              type: "primitive",
              component: "combobox",
              part: "Input",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "comboboxInput",
                    args: {},
                  },
                },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "combobox-input" } },
              ],
            },
            {
              type: "component",
              component: "input-group",
              exportName: "InputGroupAddon",
              attrs: [{ name: "align", value: { type: "literal", value: "inline-end" } }],
              children: [
                {
                  type: "conditional",
                  condition: "showTrigger",
                  then: [
                    {
                      type: "primitive",
                      component: "combobox",
                      part: "Trigger",
                      attrs: [
                        { name: "asChild", value: { type: "literal", value: true } },
                        { name: "disabled", value: { type: "variable", name: "disabled" } },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "combobox-trigger" },
                        },
                      ],
                      children: [
                        {
                          type: "component",
                          component: "input-group",
                          exportName: "InputGroupButton",
                          attrs: [
                            { name: "size", value: { type: "literal", value: "icon-sm" } },
                            { name: "variant", value: { type: "literal", value: "ghost" } },
                            { name: "disabled", value: { type: "variable", name: "disabled" } },
                            {
                              name: "class",
                              value: {
                                type: "literal",
                                value: "group-has-data-[slot=combobox-clear]/input-group:hidden",
                              },
                            },
                            {
                              name: "data-slot",
                              value: { type: "literal", value: "combobox-trigger" },
                            },
                          ],
                          children: [
                            {
                              type: "icon",
                              importName: "ChevronDown",
                              attrs: [
                                {
                                  name: "class",
                                  value: {
                                    type: "literal",
                                    value: "text-muted-foreground pointer-events-none size-4",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  else: [],
                },
                {
                  type: "conditional",
                  condition: "showClear",
                  then: [
                    {
                      type: "primitive",
                      component: "combobox",
                      part: "Clear",
                      attrs: [
                        { name: "asChild", value: { type: "literal", value: true } },
                        { name: "disabled", value: { type: "variable", name: "disabled" } },
                        {
                          name: "aria-label",
                          value: { type: "literal", value: "Clear selection" },
                        },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "combobox-clear" },
                        },
                      ],
                      children: [
                        {
                          type: "component",
                          component: "input-group",
                          exportName: "InputGroupButton",
                          attrs: [
                            { name: "size", value: { type: "literal", value: "icon-sm" } },
                            { name: "variant", value: { type: "literal", value: "ghost" } },
                            { name: "disabled", value: { type: "variable", name: "disabled" } },
                            {
                              name: "data-slot",
                              value: { type: "literal", value: "combobox-clear" },
                            },
                          ],
                          children: [
                            {
                              type: "icon",
                              importName: "X",
                              attrs: [
                                {
                                  name: "class",
                                  value: {
                                    type: "literal",
                                    value: "text-muted-foreground pointer-events-none size-4",
                                  },
                                },
                              ],
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
            { type: "slot" },
          ],
        },
      ],
    },
    {
      exportName: "ComboboxTrigger",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "iconClass", optional: true, type: "string" },
          { name: "showIcon", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "class", alias: "className" },
          { name: "iconClass", alias: "iconClassName" },
          { name: "showIcon", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Trigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxTrigger",
                args: { class: "className" },
              },
            },
            { name: "asChild", value: { type: "variable", name: "asChild" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-trigger" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "conditional",
              condition: "!asChild && showIcon",
              then: [
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
      exportName: "ComboboxClear",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      imports: [{ importName: "X", source: "@tabler/icons/outline/x.svg", type: "default" }],
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "showIcon", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "class", alias: "className" },
          { name: "disabled", defaultValue: "false" },
          { name: "showIcon", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "conditional",
          condition: "asChild",
          then: [
            {
              type: "primitive",
              component: "combobox",
              part: "Clear",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "comboboxClear",
                    args: { class: "className" },
                  },
                },
                { name: "asChild", value: { type: "variable", name: "asChild" } },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "aria-label", value: { type: "literal", value: "Clear selection" } },
                { name: "data-slot", value: { type: "literal", value: "combobox-clear" } },
              ],
              children: [
                { type: "slot" },
                {
                  type: "conditional",
                  condition: "showIcon",
                  then: [{ type: "icon", importName: "X" }],
                  else: [],
                },
              ],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "combobox",
              part: "Clear",
              attrs: [
                { name: "asChild", value: { type: "literal", value: true } },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "aria-label", value: { type: "literal", value: "Clear selection" } },
                { name: "data-slot", value: { type: "literal", value: "combobox-clear" } },
              ],
              children: [
                {
                  type: "component",
                  component: "input-group",
                  exportName: "InputGroupButton",
                  attrs: [
                    { name: "size", value: { type: "literal", value: "icon-sm" } },
                    { name: "variant", value: { type: "literal", value: "ghost" } },
                    { name: "disabled", value: { type: "variable", name: "disabled" } },
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "comboboxClear",
                        args: { class: "className" },
                      },
                    },
                    { name: "data-slot", value: { type: "literal", value: "combobox-clear" } },
                  ],
                  children: [
                    { type: "slot" },
                    {
                      type: "conditional",
                      condition: "showIcon",
                      then: [{ type: "icon", importName: "X" }],
                      else: [],
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
      exportName: "ComboboxValue",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
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
          component: "combobox",
          part: "Value",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxValue",
                args: { class: "className" },
              },
            },
            { name: "placeholder", value: { type: "variable", name: "placeholder" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-value" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxContent",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "alignOffset", optional: true, type: "number" },
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
          component: "combobox",
          part: "Portal",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "combobox-portal" } }],
          children: [
            {
              type: "primitive",
              component: "combobox",
              part: "Positioner",
              attrs: [
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "alignOffset", value: { type: "variable", name: "alignOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "data-slot", value: { type: "literal", value: "combobox-positioner" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "combobox",
                  part: "Popup",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "comboboxContent",
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
                    { name: "spread", value: { type: "variable", name: "rest" } },
                    { name: "data-slot", value: { type: "literal", value: "combobox-content" } },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "combobox",
                      part: "List",
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "comboboxList", args: {} },
                        },
                        { name: "data-slot", value: { type: "literal", value: "combobox-list" } },
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
      exportName: "ComboboxEmpty",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Empty",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxEmpty",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-empty" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxItem",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      imports: [
        { importName: "Check", source: "@tabler/icons/outline/check.svg", type: "default" },
      ],
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["role"] },
          { type: "variantProps", variant: "comboboxItem" },
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
          component: "combobox",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxItem",
                args: { inset: "inset", disabled: "disabled", class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-item" } },
          ],
          children: [
            {
              type: "primitive",
              component: "combobox",
              part: "ItemText",
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "comboboxItemText", args: {} },
                },
                { name: "data-slot", value: { type: "literal", value: "combobox-item-text" } },
              ],
              children: [{ type: "slot" }],
            },
            {
              type: "conditional",
              condition: "showIndicator",
              then: [
                {
                  type: "primitive",
                  component: "combobox",
                  part: "ItemIndicator",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "comboboxItemIndicator",
                        args: { class: "indicatorClassName" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "combobox-item-indicator" },
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
      exportName: "ComboboxItemText",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "ItemText",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxItemText",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-item-text" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxItemIndicator",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "ItemIndicator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxItemIndicator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-item-indicator" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxGroup",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Group",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxGroup",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxGroupLabel",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "GroupLabel",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxGroupLabel",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-group-label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ComboboxSeparator",
      primitiveAliases: { combobox: "ComboboxPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "combobox",
          part: "Separator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "comboboxSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "combobox-separator" } },
          ],
        },
      ],
    },
  ],
};
