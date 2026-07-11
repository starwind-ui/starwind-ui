import type { StyledAdapterContract } from "../types.js";

export const inputStyledContract: StyledAdapterContract = {
  component: "input",
  publicExports: ["Input"],
  defaultExport: { Root: "Input" },
  defaultExportMode: "component",
  variantCollectionName: "InputVariants",
  variants: {
    input: {
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
  },
  components: [
    {
      exportName: "Input",
      primitiveAliases: { input: "InputPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "input",
            keys: ["children", "defaultValue", "size", "value"],
          },
          { type: "variantProps", variant: "input" },
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
            name: "data-slot",
            optional: true,
            type: "string",
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
          { name: "data-slot", alias: "dataSlot", defaultValue: '"input"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "input",
          part: "Root",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "input",
                args: { size: "size", class: "className" },
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
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
          ],
        },
      ],
    },
  ],
};
