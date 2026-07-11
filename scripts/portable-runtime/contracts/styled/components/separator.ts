import type { StyledAdapterContract } from "../types.js";

export const separatorStyledContract: StyledAdapterContract = {
  component: "separator",
  publicExports: ["Separator"],
  defaultExport: { Root: "Separator" },
  defaultExportMode: "component",
  variantCollectionName: "SeparatorVariants",
  variants: {
    separator: {
      base: "bg-border shrink-0",
      variants: {
        orientation: {
          horizontal: "h-[1px] w-full",
          vertical: "h-full w-[1px]",
        },
      },
      defaultVariants: {
        orientation: "horizontal",
      },
    },
  },
  components: [
    {
      exportName: "Separator",
      props: {
        declaration: "type",
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["role", "aria-orientation"] },
          { type: "variantProps", variant: "separator" },
        ],
        fields: [
          {
            name: "data-slot",
            optional: true,
            type: "string",
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
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"separator"' },
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
            { name: "data-sw-separator" },
            { name: "role", value: { type: "literal", value: "separator" } },
            { name: "aria-orientation", value: { type: "variable", name: "orientation" } },
            { name: "data-orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "separator",
                args: { orientation: "orientation", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
          ],
          selfClosing: true,
        },
      ],
    },
  ],
};
