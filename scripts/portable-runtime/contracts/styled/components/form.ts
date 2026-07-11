import type { StyledAdapterContract } from "../types.js";

export const formStyledContract: StyledAdapterContract = {
  component: "form",
  publicExports: ["Form", "FormErrorSummary"],
  defaultExport: {
    ErrorSummary: "FormErrorSummary",
    Root: "Form",
  },
  defaultExportMode: "parts",
  variantCollectionName: "FormVariants",
  variants: {
    form: {
      base: "min-w-0",
    },
    formErrorSummary: {
      base: [
        "border-error/40 bg-error/7 text-error rounded-md border p-4 text-sm",
        "[&_[data-sw-form-error-summary-list]]:mt-2 [&_[data-sw-form-error-summary-list]]:grid [&_[data-sw-form-error-summary-list]]:gap-1",
        "[&_[data-sw-form-error-summary-item]]:text-left [&_[data-sw-form-error-summary-item]]:underline [&_[data-sw-form-error-summary-item]]:underline-offset-4",
      ],
    },
  },
  components: [
    {
      exportName: "Form",
      primitiveAliases: { form: "FormPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "form" },
          { type: "variantProps", variant: "form" },
        ],
        fields: [
          {
            name: "errorVisibility",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
          {
            name: "revalidationTiming",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLFormElement>",
            frameworks: ["react"],
          },
          {
            name: "validationTiming",
            optional: true,
            type: 'import("@starwind-ui/runtime/form").FormValidationTiming',
          },
        ],
      },
      destructure: {
        props: [
          { name: "errorVisibility" },
          { name: "revalidationTiming" },
          { name: "ref", frameworks: ["react"] },
          { name: "validationTiming" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "form",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "form",
                args: { class: "className" },
              },
            },
            { name: "errorVisibility", value: { type: "variable", name: "errorVisibility" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            {
              name: "revalidationTiming",
              value: { type: "variable", name: "revalidationTiming" },
            },
            {
              name: "validationTiming",
              value: { type: "variable", name: "validationTiming" },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "form" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "FormErrorSummary",
      primitiveAliases: { form: "FormPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "formErrorSummary" },
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
          type: "primitive",
          component: "form",
          part: "ErrorSummary",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "formErrorSummary",
                args: { class: "className" },
              },
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "form-error-summary" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
