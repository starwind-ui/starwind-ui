import type { StyledAdapterContract } from "../types.js";

export const checkboxGroupStyledContract: StyledAdapterContract = {
  component: "checkbox-group",
  publicExports: ["CheckboxGroup"],
  defaultExport: { Root: "CheckboxGroup" },
  defaultExportMode: "component",
  variantCollectionName: "CheckboxGroupVariants",
  variants: {
    checkboxGroup: {
      base: "grid gap-3",
    },
  },
  components: [
    {
      exportName: "CheckboxGroup",
      primitiveAliases: { "checkbox-group": "CheckboxGroupPrimitive" },
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["defaultValue", "onChange"] },
          { type: "variantProps", variant: "checkboxGroup" },
        ],
        fields: [
          { name: "defaultValue", optional: true, type: "string[]" },
          { name: "disabled", optional: true, type: "boolean" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime").CheckboxGroupValue, details: import("@starwind-ui/runtime").CheckboxGroupValueChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").CheckboxGroupValue',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "value", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "checkbox-group",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "checkboxGroup",
                args: { class: "className" },
              },
            },
            {
              name: "defaultValue",
              value: { type: "variable", name: "defaultValue" },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "value", value: { type: "variable", name: "value" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "checkbox-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
