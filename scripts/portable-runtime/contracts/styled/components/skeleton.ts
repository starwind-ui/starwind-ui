import type { StyledAdapterContract } from "../types.js";

export const skeletonStyledContract: StyledAdapterContract = {
  component: "skeleton",
  publicExports: ["Skeleton"],
  defaultExport: { Root: "Skeleton" },
  defaultExportMode: "component",
  variantCollectionName: "SkeletonVariants",
  variants: {
    skeleton: {
      base: "bg-muted animate-pulse rounded-md",
    },
  },
  components: [
    {
      exportName: "Skeleton",
      props: {
        declaration: "interface",
        extends: [{ type: "omitHtmlAttributes", element: "div", keys: ["children"] }],
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
          selfClosing: true,
          attrs: [
            { name: "data-sw-skeleton" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "skeleton",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "skeleton" } },
          ],
        },
      ],
    },
  ],
};
