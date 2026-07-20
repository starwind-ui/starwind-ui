import type { StyledAdapterContract } from "../types.js";

export const checkboxStyledContract: StyledAdapterContract = {
  component: "checkbox",
  publicExports: ["Checkbox"],
  defaultExport: { Root: "Checkbox" },
  defaultExportMode: "component",
  variantCollectionName: "CheckboxVariants",
  variants: {
    checkboxWrapper: {
      base: "relative flex items-center space-x-2",
    },
    checkbox: {
      base: [
        "peer border-input bg-background dark:bg-input/30 relative flex shrink-0 items-center justify-center rounded-sm border",
        "transition-all focus-visible:ring-3",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "outline-0 focus:ring-0 focus:ring-offset-0",
        "not-data-disabled:cursor-pointer data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
      ],
      variants: {
        size: {
          sm: "size-4",
          md: "size-5",
          lg: "size-6",
        },
        variant: {
          default:
            "data-checked:bg-foreground data-checked:border-foreground focus-visible:ring-outline/50 focus-visible:border-outline",
          primary:
            "data-checked:bg-primary data-checked:border-primary focus-visible:ring-primary/50 focus-visible:border-primary",
          secondary:
            "data-checked:bg-secondary data-checked:border-secondary focus-visible:ring-secondary/50 focus-visible:border-secondary",
          info: "data-checked:bg-info data-checked:border-info focus-visible:ring-info/50 focus-visible:border-info",
          success:
            "data-checked:bg-success data-checked:border-success focus-visible:ring-success/50 focus-visible:border-success",
          warning:
            "data-checked:bg-warning data-checked:border-warning focus-visible:ring-warning/50 focus-visible:border-warning",
          error:
            "data-checked:bg-error data-checked:border-error focus-visible:ring-error/50 focus-visible:border-error",
        },
      },
      defaultVariants: { size: "md", variant: "default" },
    },
    checkboxIndicator: {
      base: [
        "pointer-events-none grid place-content-center p-0.5 opacity-0 transition-opacity [&>svg]:size-full",
      ],
      variants: {
        size: {
          sm: "size-4",
          md: "size-5",
          lg: "size-6",
        },
        variant: {
          default: "text-background",
          primary: "text-primary-foreground",
          secondary: "text-secondary-foreground",
          info: "text-info-foreground",
          success: "text-success-foreground",
          warning: "text-warning-foreground",
          error: "text-error-foreground",
        },
      },
      defaultVariants: { size: "md", variant: "default" },
    },
    checkboxLabel: {
      base: "font-medium peer-not-data-disabled:cursor-pointer peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-70",
      variants: {
        size: {
          sm: "text-sm",
          md: "text-base",
          lg: "text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
  },
  styles: {
    content: [
      "[data-sw-checkbox-check-icon] {",
      "  stroke-dasharray: 65;",
      "  stroke-dashoffset: 65;",
      "  opacity: 0;",
      "}",
      "",
      '[data-sw-checkbox][data-checked] [data-slot="checkbox-indicator"],',
      '[data-sw-checkbox][data-indeterminate] [data-slot="checkbox-indicator"] {',
      "  opacity: 1;",
      "}",
      "",
      '[data-sw-checkbox] [data-slot="checkbox-indicator"] > svg {',
      "  display: block;",
      "  margin: auto;",
      "}",
      "",
      '[data-sw-checkbox][data-checked] [data-slot="checkbox-indicator"] > [data-sw-checkbox-check-icon],',
      '[data-sw-checkbox][data-indeterminate] [data-slot="checkbox-indicator"] > [data-sw-checkbox-check-icon] {',
      "  animation: draw-check 0.3s ease forwards;",
      "  animation-delay: 0.15s;",
      "}",
      "",
      "@keyframes draw-check {",
      "  0% {",
      "    stroke-dashoffset: 65;",
      "    opacity: 1;",
      "  }",
      "",
      "  100% {",
      "    stroke-dashoffset: 0;",
      "    opacity: 1;",
      "  }",
      "}",
    ],
    importFrom: ["Checkbox"],
  },
  components: [
    {
      exportName: "Checkbox",
      primitiveAliases: { checkbox: "CheckboxPrimitive" },
      imports: [
        {
          importName: "Check",
          source: "@tabler/icons/outline/check.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "span",
            keys: ["defaultChecked", "id", "onChange"],
          },
          { type: "variantProps", variant: "checkbox" },
        ],
        fields: [
          { name: "checked", optional: true, type: "boolean" },
          { name: "defaultChecked", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "id", optional: true, type: "string" },
          { name: "indeterminate", optional: true, type: "boolean" },
          { name: "label", optional: true, type: "string" },
          { name: "name", optional: true, type: "string" },
          { name: "nativeButton", optional: true, type: "boolean" },
          {
            name: "onCheckedChange",
            optional: true,
            type: '(checked: boolean, details: import("@starwind-ui/runtime").CheckboxCheckedChangeDetails) => void',
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
          { name: "uncheckedValue", optional: true, type: "string" },
          { name: "value", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "size" },
          { name: "checked", frameworks: ["astro", "react"] },
          { name: "checked", defaultValue: "undefined", frameworks: ["vue"] },
          { name: "defaultChecked" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "id" },
          { name: "indeterminate", defaultValue: "false" },
          { name: "label" },
          { name: "name" },
          { name: "nativeButton", defaultValue: "false" },
          { name: "onCheckedChange", frameworks: ["react"] },
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
          name: "ariaLabel",
          value: { type: "raw", code: 'rest["aria-label"] ?? label' },
        },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "checkboxWrapper" },
            },
            { name: "data-sw-checkbox-wrapper" },
            { name: "data-slot", value: { type: "literal", value: "checkbox-wrapper" } },
          ],
          children: [
            {
              type: "primitive",
              component: "checkbox",
              part: "Root",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "checkbox",
                    args: { variant: "variant", size: "size", class: "className" },
                  },
                },
                {
                  name: "checked",
                  value: { type: "variable", name: "checked" },
                  frameworks: ["astro", "react"],
                },
                {
                  name: "defaultChecked",
                  value: { type: "variable", name: "defaultChecked" },
                },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "form", value: { type: "variable", name: "form" } },
                { name: "id", value: { type: "variable", name: "id" } },
                {
                  name: "indeterminate",
                  value: { type: "variable", name: "indeterminate" },
                },
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
                {
                  name: "uncheckedValue",
                  value: { type: "variable", name: "uncheckedValue" },
                },
                { name: "value", value: { type: "variable", name: "value" } },
                {
                  name: "spread",
                  value: { type: "variable", name: "rest" },
                  frameworks: ["astro", "react"],
                },
                {
                  name: "aria-label",
                  value: { type: "variable", name: "ariaLabel" },
                  frameworks: ["astro", "react"],
                },
                {
                  name: "spread",
                  value: {
                    type: "raw",
                    code: "{ ...(checked === undefined ? {} : { checked }), ...rest, 'aria-label': ariaLabel }",
                  },
                  frameworks: ["vue"],
                },
                { name: "data-slot", value: { type: "literal", value: "checkbox" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "checkbox",
                  part: "Indicator",
                  attrs: [
                    { name: "keepMounted" },
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "checkboxIndicator",
                        args: { variant: "variant", size: "size" },
                      },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "checkbox-indicator" },
                    },
                  ],
                  children: [
                    {
                      type: "icon",
                      attrs: [{ name: "data-sw-checkbox-check-icon" }],
                      importName: "Check",
                    },
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
                      frameworks: ["astro", "vue"],
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
                        variant: "checkboxLabel",
                        args: { size: "size" },
                      },
                    },
                    { name: "data-slot", value: { type: "literal", value: "checkbox-label" } },
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
