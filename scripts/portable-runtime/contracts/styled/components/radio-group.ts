import type { StyledAdapterContract } from "../types.js";

export const radioGroupStyledContract: StyledAdapterContract = {
  component: "radio-group",
  publicExports: ["RadioGroup", "RadioGroupItem"],
  defaultExport: { Root: "RadioGroup", Item: "RadioGroupItem" },
  variantCollectionName: "RadioGroupVariants",
  variants: {
    radioGroup: {
      base: "disabled:cursor-not-allowed disabled:opacity-70",
      variants: {
        orientation: {
          vertical: "grid gap-3",
          horizontal: "flex flex-row items-center gap-3",
        },
      },
      defaultVariants: { orientation: "vertical" },
    },
    radioWrapper: {
      base: "relative isolate flex shrink-0",
      variants: {
        size: {
          sm: "size-4",
          md: "size-5",
          lg: "size-6",
        },
      },
      defaultVariants: { size: "md" },
    },
    radioItem: {
      base: [
        "group/radio peer relative z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full",
        "outline-none focus:outline-none focus-visible:outline-none",
        "data-disabled:cursor-not-allowed",
      ],
    },
    radioControl: {
      base: [
        "border-input bg-background dark:bg-input/30",
        "absolute inset-0 rounded-full border shadow-xs",
        "transition-[color,box-shadow]",
        "group-focus-visible/radio:ring-3",
        "group-data-disabled/radio:cursor-not-allowed group-data-disabled/radio:opacity-50",
        "group-data-error-visible/radio:border-error group-focus-visible/radio:group-data-error-visible/radio:ring-error/40",
        "flex items-center justify-center",
      ],
      variants: {
        variant: {
          default:
            "group-data-checked/radio:border-foreground [&>span>svg]:fill-foreground group-focus-visible/radio:ring-outline/50",
          primary:
            "group-data-checked/radio:border-primary [&>span>svg]:fill-primary group-focus-visible/radio:ring-primary/50",
          secondary:
            "group-data-checked/radio:border-secondary [&>span>svg]:fill-secondary group-focus-visible/radio:ring-secondary/50",
          info: "group-data-checked/radio:border-info [&>span>svg]:fill-info group-focus-visible/radio:ring-info/50",
          success:
            "group-data-checked/radio:border-success [&>span>svg]:fill-success group-focus-visible/radio:ring-success/50",
          warning:
            "group-data-checked/radio:border-warning [&>span>svg]:fill-warning group-focus-visible/radio:ring-warning/50",
          error:
            "group-data-checked/radio:border-error [&>span>svg]:fill-error group-focus-visible/radio:ring-error/50",
        },
      },
      defaultVariants: { variant: "primary" },
    },
    radioIndicator: {
      base: [
        "flex items-center justify-center",
        "opacity-0 transition-opacity data-checked:opacity-100",
        "[&>svg]:size-full [&>svg]:shrink-0",
      ],
      variants: {
        size: {
          sm: "size-2",
          md: "size-3",
          lg: "size-4",
        },
      },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "RadioGroup",
      primitiveAliases: { "radio-group": "RadioGroupPrimitive" },
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["defaultValue", "onChange"] },
          { type: "variantProps", variant: "radioGroup" },
        ],
        fields: [
          { name: "defaultValue", optional: true, type: "string" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "legend", optional: true, type: "string" },
          { name: "name", optional: true, type: "string" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: string, details: import("@starwind-ui/runtime").RadioGroupValueChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          { name: "readOnly", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "required", optional: true, type: "boolean" },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").RadioGroupValue',
            frameworks: ["react"],
          },
          { name: "value", optional: true, type: "string", frameworks: ["astro"] },
        ],
      },
      destructure: {
        props: [
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "legend" },
          { name: "name" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "orientation", defaultValue: '"vertical"' },
          { name: "readOnly", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "required", defaultValue: "false" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "radio-group",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "radioGroup",
                args: { orientation: "orientation", class: "className" },
              },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "form", value: { type: "variable", name: "form" } },
            { name: "name", value: { type: "variable", name: "name" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            { name: "readOnly", value: { type: "variable", name: "readOnly" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "required", value: { type: "variable", name: "required" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "aria-label", value: { type: "variable", name: "legend" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "radio-group" } },
          ],
          children: [
            {
              type: "conditional",
              condition: "legend",
              then: [
                {
                  type: "element",
                  tag: "div",
                  attrs: [
                    { name: "class", value: { type: "literal", value: "sr-only" } },
                    { name: "data-slot", value: { type: "literal", value: "radio-group-legend" } },
                  ],
                  children: [{ type: "text", value: "{legend}" }],
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
      exportName: "RadioGroupItem",
      primitiveAliases: { radio: "RadioPrimitive" },
      imports: [
        {
          importName: "CircleFilled",
          source: "@tabler/icons/filled/circle.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "span",
            keys: ["defaultChecked", "onChange"],
          },
          { type: "variantProps", variant: "radioWrapper" },
          { type: "variantProps", variant: "radioControl" },
        ],
        fields: [
          { name: "checked", optional: true, type: "boolean" },
          { name: "defaultChecked", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "id", optional: true, type: "string" },
          { name: "name", optional: true, type: "string" },
          { name: "nativeButton", optional: true, type: "boolean" },
          {
            name: "onCheckedChange",
            optional: true,
            type: '(checked: boolean, details: import("@starwind-ui/runtime").RadioCheckedChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "readOnly", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLSpanElement | HTMLButtonElement>",
            frameworks: ["react"],
          },
          { name: "required", optional: true, type: "boolean" },
          { name: "value", type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "size", defaultValue: '"md"' },
          { name: "checked" },
          { name: "defaultChecked" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "id" },
          { name: "name" },
          { name: "nativeButton", defaultValue: "false" },
          { name: "onCheckedChange", frameworks: ["react"] },
          { name: "readOnly", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "required", defaultValue: "false" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "radioWrapper", args: { size: "size" } },
            },
            { name: "data-slot", value: { type: "literal", value: "radio-group-item-wrapper" } },
          ],
          children: [
            {
              type: "primitive",
              component: "radio",
              part: "Root",
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "radioItem" },
                },
                { name: "checked", value: { type: "variable", name: "checked" } },
                { name: "defaultChecked", value: { type: "variable", name: "defaultChecked" } },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "form", value: { type: "variable", name: "form" } },
                { name: "id", value: { type: "variable", name: "id" } },
                { name: "name", value: { type: "variable", name: "name" } },
                { name: "nativeButton", value: { type: "variable", name: "nativeButton" } },
                {
                  name: "onCheckedChange",
                  value: { type: "variable", name: "onCheckedChange" },
                  frameworks: ["react"],
                },
                { name: "readOnly", value: { type: "variable", name: "readOnly" } },
                { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
                { name: "required", value: { type: "variable", name: "required" } },
                { name: "value", value: { type: "variable", name: "value" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "radio-group-item" } },
              ],
              children: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "radioControl",
                        args: { variant: "variant", class: "className" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "radio-group-item-control" },
                    },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "radio",
                      part: "Indicator",
                      attrs: [
                        {
                          name: "class",
                          value: {
                            type: "classVariant",
                            variant: "radioIndicator",
                            args: { size: "size" },
                          },
                        },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "radio-group-item-indicator" },
                        },
                      ],
                      children: [
                        {
                          type: "slot",
                          name: "icon",
                          fallback: [
                            {
                              type: "icon",
                              attrs: [],
                              importName: "CircleFilled",
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
    },
  ],
};
