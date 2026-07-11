import type { StyledAdapterContract } from "../types.js";

export const inputOtpStyledContract: StyledAdapterContract = {
  component: "input-otp",
  constants: {
    REGEXP_ONLY_DIGITS: "/^[0-9]+$/",
    REGEXP_ONLY_DIGITS_AND_CHARS: "/^[A-Za-z0-9]+$/",
  },
  publicExports: ["InputOtp", "InputOtpGroup", "InputOtpSeparator", "InputOtpSlot"],
  defaultExport: {
    Root: "InputOtp",
    Group: "InputOtpGroup",
    Separator: "InputOtpSeparator",
    Slot: "InputOtpSlot",
  },
  variantCollectionName: "InputOtpVariants",
  variants: {
    inputOtp: {
      base: "flex items-center gap-2 outline-none data-disabled:opacity-50",
    },
    inputOtpGroup: {
      base: "flex items-center",
    },
    inputOtpSeparator: {
      base: "text-muted-foreground",
    },
    inputOtpSlot: {
      base: [
        "border-input dark:bg-input/30 text-foreground border bg-transparent text-center shadow-xs",
        "relative flex items-center justify-center border-y border-r text-sm transition-all outline-none",
        "first:rounded-l-md first:border-l last:rounded-r-md disabled:cursor-not-allowed disabled:opacity-50",
        "data-[active=true]:border-outline data-[active=true]:ring-outline/50 data-[active=true]:z-10 data-[active=true]:ring-3",
        "data-[active=true]:data-error-visible:ring-error/40",
        "data-error-visible:border-error data-[active=true]:data-error-visible:border-error",
      ],
      variants: {
        size: {
          sm: "size-9 text-sm",
          md: "size-11 text-base",
          lg: "size-12 text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "InputOtp",
      primitiveAliases: { "input-otp": "InputOtpPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "div",
            keys: ["defaultValue", "id", "onChange", "pattern", "value"],
          },
          { type: "variantProps", variant: "inputOtp" },
        ],
        fields: [
          { name: "defaultValue", optional: true, type: "string" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "id", optional: true, type: "string" },
          { name: "maxLength", optional: true, type: "number" },
          { name: "name", optional: true, type: "string" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: string, details: import("@starwind-ui/runtime").InputOtpValueChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "pattern", optional: true, type: "RegExp | string" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "readOnly", optional: true, type: "boolean" },
          { name: "required", optional: true, type: "boolean" },
          { name: "value", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "id" },
          { name: "maxLength", defaultValue: "6" },
          { name: "name" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "pattern" },
          { name: "ref", frameworks: ["react"] },
          { name: "readOnly", defaultValue: "false" },
          { name: "required", defaultValue: "false" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "input-otp",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputOtp",
                args: { class: "className" },
              },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "form", value: { type: "variable", name: "form" } },
            { name: "id", value: { type: "variable", name: "id" } },
            { name: "maxLength", value: { type: "variable", name: "maxLength" } },
            { name: "name", value: { type: "variable", name: "name" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "pattern", value: { type: "variable", name: "pattern" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "readOnly", value: { type: "variable", name: "readOnly" } },
            { name: "required", value: { type: "variable", name: "required" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-otp" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputOtpGroup",
      primitiveAliases: { "input-otp": "InputOtpPrimitive" },
      props: {
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
          component: "input-otp",
          part: "Group",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputOtpGroup",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-otp-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputOtpSlot",
      primitiveAliases: { "input-otp": "InputOtpPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "inputOtpSlot" },
        ],
        fields: [
          { name: "index", optional: true, type: "number" },
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
          { name: "size" },
          { name: "index" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "input-otp",
          part: "Slot",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputOtpSlot",
                args: { size: "size", class: "className" },
              },
            },
            { name: "index", value: { type: "variable", name: "index" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-otp-slot" } },
          ],
        },
      ],
    },
    {
      exportName: "InputOtpSeparator",
      primitiveAliases: { "input-otp": "InputOtpPrimitive" },
      imports: [
        {
          importName: "Minus",
          source: "@tabler/icons/outline/minus.svg",
          type: "default",
        },
      ],
      props: {
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
          component: "input-otp",
          part: "Separator",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputOtpSeparator",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-otp-separator" } },
          ],
          children: [
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "Minus",
                  attrs: [{ name: "class", value: { type: "literal", value: "size-6" } }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
