import type { StyledAdapterContract } from "../types.js";

export const labelStyledContract: StyledAdapterContract = {
  component: "label",
  publicExports: ["Label"],
  defaultExport: { Root: "Label" },
  defaultExportMode: "component",
  variantCollectionName: "LabelVariants",
  variants: {
    label: {
      base: [
        "text-foreground leading-none font-medium",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70 has-[+:disabled]:cursor-not-allowed has-[+:disabled]:opacity-70",
      ],
      variants: { size: { sm: "text-sm", md: "text-base", lg: "text-lg" } },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "Label",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "label" },
          { type: "variantProps", variant: "label" },
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
          type: "element",
          tag: "label",
          leadingComments: [
            {
              frameworks: ["astro"],
              value: "eslint-disable-next-line astro/jsx-a11y/label-has-associated-control",
            },
          ],
          attrs: [
            { name: "data-sw-label" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "label",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "label" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
