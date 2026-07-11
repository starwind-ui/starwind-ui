import type { StyledAdapterContract } from "../types.js";

export const fieldStyledContract: StyledAdapterContract = {
  component: "field",
  publicExports: [
    "Field",
    "FieldContent",
    "FieldControl",
    "FieldDescription",
    "FieldError",
    "FieldGroup",
    "FieldItem",
    "FieldLabel",
    "FieldLegend",
    "FieldSeparator",
    "FieldSet",
    "FieldTitle",
    "FieldValidity",
  ],
  defaultExport: {
    Content: "FieldContent",
    Control: "FieldControl",
    Description: "FieldDescription",
    Error: "FieldError",
    Group: "FieldGroup",
    Item: "FieldItem",
    Label: "FieldLabel",
    Legend: "FieldLegend",
    Root: "Field",
    Separator: "FieldSeparator",
    Set: "FieldSet",
    Title: "FieldTitle",
    Validity: "FieldValidity",
  },
  defaultExportMode: "parts",
  variantCollectionName: "FieldVariants",
  variants: {
    field: {
      base: "group/field min-w-0",
      variants: {
        orientation: {
          horizontal: "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1",
          responsive:
            "flex flex-col gap-2 sm:grid sm:grid-cols-[auto_1fr] sm:items-start sm:gap-x-3 sm:gap-y-1",
          vertical: "flex flex-col gap-2",
        },
      },
      defaultVariants: { orientation: "vertical" },
    },
    fieldContent: {
      base: "flex min-w-0 flex-col gap-1.5",
    },
    fieldControl: {
      base: [
        "border-input dark:bg-input/30 text-foreground w-full rounded-md border bg-transparent shadow-xs",
        "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] focus-visible:ring-3 focus-visible:transition-none",
        "file:text-foreground file:my-auto file:mr-4 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
        "peer placeholder:text-muted-foreground",
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
    fieldDescription: {
      base: "text-muted-foreground text-sm",
    },
    fieldError: {
      base: "text-error text-sm font-medium",
    },
    fieldGroup: {
      base: "group/field-group flex min-w-0 flex-col gap-6",
      variants: {
        variant: {
          default: "",
          outline: "rounded-md border p-4",
        },
      },
      defaultVariants: { variant: "default" },
    },
    fieldItem: {
      base: "flex items-start gap-3",
    },
    fieldLabel: {
      base: [
        "text-foreground leading-none font-medium",
        "data-disabled:cursor-not-allowed data-disabled:opacity-70 data-invalid:text-error",
      ],
      variants: { size: { sm: "text-sm", md: "text-base", lg: "text-lg" } },
      defaultVariants: { size: "md" },
    },
    fieldLegend: {
      base: [
        "text-foreground font-medium",
        "data-disabled:cursor-not-allowed data-disabled:opacity-70",
      ],
      variants: {
        variant: {
          label: "text-sm leading-none",
          legend: "text-base",
        },
      },
      defaultVariants: { variant: "legend" },
    },
    fieldSeparator: {
      base: ["relative -my-2 h-5 text-sm", "group-data-[variant=outline]/field-group:-mb-2"],
    },
    fieldSeparatorContent: {
      base: ["bg-background text-muted-foreground", "relative mx-auto block w-fit px-2"],
    },
    fieldSet: {
      base: [
        "flex min-w-0 flex-col gap-6 border-0 p-0",
        "disabled:pointer-events-none disabled:opacity-70 data-disabled:pointer-events-none data-disabled:opacity-70",
      ],
    },
    fieldTitle: {
      base: "text-foreground font-medium leading-none",
    },
    fieldValidity: {
      base: "text-muted-foreground text-sm font-medium data-invalid:text-error data-valid:text-success",
    },
  },
  components: [
    {
      exportName: "Field",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "field" },
        ],
        fields: [
          { name: "dirty", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          {
            name: "errorVisibility",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
          { name: "invalid", optional: true, type: "boolean" },
          { name: "name", optional: true, type: "string" },
          {
            name: "revalidationTiming",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
          { name: "touched", optional: true, type: "boolean" },
          {
            name: "validationTiming",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "dirty" },
          { name: "disabled", defaultValue: "false" },
          { name: "errorVisibility" },
          { name: "invalid" },
          { name: "name" },
          { name: "orientation" },
          { name: "revalidationTiming" },
          { name: "touched" },
          { name: "validationTiming" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "field",
                args: { orientation: "orientation", class: "className" },
              },
            },
            { name: "dirty", value: { type: "variable", name: "dirty" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "errorVisibility", value: { type: "variable", name: "errorVisibility" } },
            { name: "invalid", value: { type: "variable", name: "invalid" } },
            { name: "name", value: { type: "variable", name: "name" } },
            {
              name: "revalidationTiming",
              value: { type: "variable", name: "revalidationTiming" },
            },
            { name: "touched", value: { type: "variable", name: "touched" } },
            {
              name: "validationTiming",
              value: { type: "variable", name: "validationTiming" },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldSet",
      primitiveAliases: { fieldset: "FieldsetPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "fieldset" },
          { type: "variantProps", variant: "fieldSet" },
        ],
        fields: [
          { name: "disabled", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLFieldSetElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "disabled", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "fieldset",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldSet",
                args: { class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-set" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldLegend",
      primitiveAliases: { fieldset: "FieldsetPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "fieldLegend" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "fieldset",
          part: "Legend",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldLegend",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-legend" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldGroup",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "fieldGroup" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"default"' },
          { name: "ref", frameworks: ["react"] },
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
              value: {
                type: "classVariant",
                variant: "fieldGroup",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "data-variant", value: { type: "variable", name: "variant" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldContent",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "fieldContent" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
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
              value: {
                type: "classVariant",
                variant: "fieldContent",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldTitle",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "fieldTitle" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
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
              value: {
                type: "classVariant",
                variant: "fieldTitle",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldLabel",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "label" },
          { type: "variantProps", variant: "fieldLabel" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLLabelElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Label",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldLabel",
                args: { size: "size", class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldControl",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "input",
            keys: ["children", "defaultValue", "size", "value"],
          },
          { type: "variantProps", variant: "fieldControl" },
        ],
        fields: [
          {
            name: "defaultValue",
            optional: true,
            type: "string | number | string[]",
            frameworks: ["astro"],
          },
          {
            name: "defaultValue",
            optional: true,
            type: 'import("@starwind-ui/runtime").InputValue',
            frameworks: ["react"],
          },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: string, details: import("@starwind-ui/runtime").InputValueChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLInputElement>",
            frameworks: ["react"],
          },
          {
            name: "value",
            optional: true,
            type: "string | number | string[]",
            frameworks: ["astro"],
          },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").InputValue',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "size" },
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Control",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldControl",
                args: { size: "size", class: "className" },
              },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-control" } },
          ],
        },
      ],
    },
    {
      exportName: "FieldDescription",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "p" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLParagraphElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldDescription",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldError",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          {
            name: "match",
            optional: true,
            type: 'boolean | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valid" | "valueMissing"',
          },
          {
            name: "messageSource",
            optional: true,
            type: '"children" | "validation"',
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "match" },
          { name: "messageSource" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Error",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldError",
                args: { class: "className" },
              },
            },
            { name: "match", value: { type: "variable", name: "match" } },
            { name: "messageSource", value: { type: "variable", name: "messageSource" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-error" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldValidity",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "fieldValidity" },
        ],
        fields: [
          {
            name: "match",
            optional: true,
            type: 'boolean | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valid" | "valueMissing"',
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "match" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Validity",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldValidity",
                args: { class: "className" },
              },
            },
            { name: "match", value: { type: "variable", name: "match" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-validity" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldItem",
      primitiveAliases: { field: "FieldPrimitive" },
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "field",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldItem",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "field-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FieldSeparator",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          frameworks: ["astro"],
          name: "hasContent",
          value: { type: "raw", code: 'Astro.slots.has("default")' },
        },
        {
          frameworks: ["react"],
          name: "hasContent",
          value: { type: "raw", code: "Boolean(children)" },
        },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "fieldSeparator",
                args: { class: "className" },
              },
            },
            {
              frameworks: ["astro"],
              name: "data-content",
              value: { type: "raw", code: 'hasContent ? "true" : "false"' },
            },
            {
              frameworks: ["react"],
              name: "data-content",
              value: { type: "variable", name: "hasContent" },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "field-separator" } },
          ],
          children: [
            {
              type: "component",
              component: "separator",
              exportName: "Separator",
              selfClosing: true,
              attrs: [
                {
                  name: "class",
                  value: { type: "literal", value: "absolute inset-0 top-1/2" },
                },
              ],
            },
            {
              type: "conditional",
              condition: "hasContent",
              then: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "fieldSeparatorContent" },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "field-separator-content" },
                    },
                  ],
                  children: [{ type: "slot" }],
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
