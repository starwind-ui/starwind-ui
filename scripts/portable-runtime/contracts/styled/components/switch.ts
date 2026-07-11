import type { StyledAdapterContract } from "../types.js";

export const switchStyledContract: StyledAdapterContract = {
  component: "switch",
  publicExports: ["Switch"],
  defaultExport: { Root: "Switch" },
  defaultExportMode: "component",
  variantCollectionName: "SwitchVariants",
  variants: {
    switchWrapper: {
      base: "flex items-center",
    },
    switchButton: {
      base: [
        "border-input bg-muted inline-flex h-(--height) w-(--width) items-center rounded-full border",
        "group peer ring-offset-background transition outline-none focus-visible:ring-3",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
        "not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
      ],
      variants: {
        variant: {
          primary:
            "aria-checked:border-primary focus-visible:border-primary/70 focus:ring-primary/50",
          secondary:
            "aria-checked:border-secondary focus-visible:border-secondary/70 focus:ring-secondary/50",
          default:
            "aria-checked:border-foreground focus-visible:border-outline focus:ring-outline/50",
          info: "aria-checked:border-info focus-visible:border-info/70 focus:ring-info/50",
          success:
            "aria-checked:border-success focus-visible:border-success/70 focus:ring-success/50",
          warning:
            "aria-checked:border-warning focus-visible:border-warning/70 focus:ring-warning/50",
          error: "aria-checked:border-error focus-visible:border-error/70 focus:ring-error/50",
        },
      },
      defaultVariants: { variant: "default" },
    },
    switchToggle: {
      base: [
        "bg-foreground inline-block transform rounded-full transition-transform",
        "group-aria-checked:translate-x-(--translation) group-aria-[checked=false]:translate-x-[calc(var(--padding)-var(--border-offset))]",
      ],
      variants: { size: { sm: "size-4", md: "size-5", lg: "size-6" } },
      defaultVariants: { size: "md" },
    },
    switchLabel: {
      base: "text-foreground ml-2 font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      variants: { size: { sm: "text-sm", md: "text-base", lg: "text-lg" } },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "Switch",
      primitiveAliases: { switch: "SwitchPrimitive" },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "button",
            keys: ["aria-checked", "defaultChecked", "onChange", "role", "type"],
          },
          { type: "variantProps", variant: "switchButton" },
          { type: "variantProps", variant: "switchToggle" },
        ],
        fields: [
          { name: "checked", optional: true, type: "boolean" },
          { name: "defaultChecked", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "id", type: "string" },
          { name: "label", optional: true, type: "string" },
          { name: "name", optional: true, type: "string" },
          {
            name: "onCheckedChange",
            optional: true,
            type: '(checked: boolean, details: import("@starwind-ui/runtime").SwitchCheckedChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "padding", optional: true, type: "number" },
          { name: "readOnly", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLSpanElement | HTMLButtonElement>",
            frameworks: ["react"],
          },
          { name: "required", optional: true, type: "boolean" },
          { name: "uncheckedValue", optional: true, type: "string" },
          { name: "value", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"default"' },
          { name: "size", defaultValue: '"md"' },
          { name: "checked" },
          { name: "defaultChecked" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "id" },
          { name: "label" },
          { name: "name" },
          { name: "onCheckedChange", frameworks: ["react"] },
          { name: "padding" },
          { name: "readOnly", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "required", defaultValue: "false" },
          { name: "uncheckedValue" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "resolvedPadding",
          value: {
            type: "raw",
            code: 'padding ?? (size === "sm" ? 2.5 : size === "lg" ? 4 : 3)',
          },
        },
        {
          name: "sizeMultiplier",
          value: { type: "raw", code: 'size === "sm" ? 4 : size === "lg" ? 6 : 5' },
        },
        {
          name: "ariaLabel",
          value: { type: "raw", code: 'rest["aria-label"] ?? label ?? "switch"' },
        },
        {
          name: "switchStyle",
          value: {
            type: "object",
            entries: {
              '"--padding"': {
                type: "template",
                parts: [{ type: "variable", name: "resolvedPadding" }, "px"],
              },
              '"--height"': {
                type: "template",
                parts: [
                  "calc((var(--spacing) * ",
                  { type: "variable", name: "sizeMultiplier" },
                  ") + (var(--padding) * 2))",
                ],
              },
              '"--width"': {
                type: "template",
                parts: [
                  "calc((var(--spacing) * ",
                  { type: "variable", name: "sizeMultiplier" },
                  " * 2) + (var(--padding) * 3))",
                ],
              },
              '"--border-offset"': { type: "literal", value: "1px" },
            },
          },
        },
        {
          name: "thumbStyle",
          value: {
            type: "object",
            entries: {
              '"--translation"': {
                type: "template",
                parts: [
                  "calc((var(--spacing) * ",
                  { type: "variable", name: "sizeMultiplier" },
                  ") + (var(--padding) * 2) - var(--border-offset))",
                ],
              },
            },
          },
        },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "switchWrapper" },
            },
            { name: "data-sw-switch-wrapper" },
            { name: "data-slot", value: { type: "literal", value: "switch-wrapper" } },
          ],
          children: [
            {
              type: "primitive",
              component: "switch",
              part: "Root",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "switchButton",
                    args: { variant: "variant", class: "className" },
                  },
                },
                { name: "checked", value: { type: "variable", name: "checked" } },
                {
                  name: "defaultChecked",
                  value: { type: "variable", name: "defaultChecked" },
                },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "form", value: { type: "variable", name: "form" } },
                { name: "id", value: { type: "variable", name: "id" } },
                { name: "name", value: { type: "variable", name: "name" } },
                { name: "nativeButton" },
                {
                  name: "onCheckedChange",
                  value: { type: "variable", name: "onCheckedChange" },
                  frameworks: ["react"],
                },
                { name: "readOnly", value: { type: "variable", name: "readOnly" } },
                { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
                { name: "required", value: { type: "variable", name: "required" } },
                {
                  name: "uncheckedValue",
                  value: { type: "variable", name: "uncheckedValue" },
                },
                { name: "value", value: { type: "variable", name: "value" } },
                {
                  name: "style",
                  value: { type: "variable", name: "switchStyle" },
                  frameworks: ["astro"],
                },
                {
                  name: "style",
                  value: { type: "raw", code: "switchStyle as React.CSSProperties" },
                  frameworks: ["react"],
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "aria-label", value: { type: "variable", name: "ariaLabel" } },
                { name: "data-slot", value: { type: "literal", value: "switch-button" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "switch",
                  part: "Thumb",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "switchToggle",
                        args: { size: "size" },
                      },
                    },
                    {
                      name: "style",
                      value: { type: "variable", name: "thumbStyle" },
                      frameworks: ["astro"],
                    },
                    {
                      name: "style",
                      value: { type: "raw", code: "thumbStyle as React.CSSProperties" },
                      frameworks: ["react"],
                    },
                    { name: "data-slot", value: { type: "literal", value: "switch-toggle" } },
                  ],
                },
              ],
            },
            {
              type: "conditional",
              condition: "label",
              then: [
                {
                  type: "element",
                  tag: "label",
                  attrs: [
                    {
                      name: "for",
                      value: { type: "variable", name: "id" },
                      frameworks: ["astro"],
                    },
                    {
                      name: "htmlFor",
                      value: { type: "variable", name: "id" },
                      frameworks: ["react"],
                    },
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "switchLabel",
                        args: { size: "size" },
                      },
                    },
                    { name: "data-slot", value: { type: "literal", value: "switch-label" } },
                  ],
                  children: [{ type: "text", value: "{label}" }],
                },
              ],
              else: [],
            },
          ],
        },
      ],
    },
  ],
};
