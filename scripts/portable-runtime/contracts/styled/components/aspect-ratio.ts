import type { StyledAdapterContract } from "../types.js";

export const aspectRatioStyledContract: StyledAdapterContract = {
  component: "aspect-ratio",
  publicExports: ["AspectRatio"],
  defaultExport: { Root: "AspectRatio" },
  defaultExportMode: "component",
  variantCollectionName: "AspectRatioVariants",
  variants: {
    aspectRatioWrapper: {
      base: "relative w-full",
    },
    aspectRatio: {
      base: "absolute inset-0",
    },
  },
  components: [
    {
      exportName: "AspectRatio",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "aspectRatio" },
        ],
        fields: [
          {
            name: "as",
            optional: true,
            type: "keyof HTMLElementTagNameMap",
            frameworks: ["astro"],
          },
          {
            name: "as",
            optional: true,
            type: "React.ElementType",
            frameworks: ["react"],
          },
          {
            name: "ratio",
            optional: true,
            type: "number",
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ratio", defaultValue: "1" },
          { name: "as", alias: "Tag", defaultValue: '"div"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          frameworks: ["astro"],
          name: "wrapperStyle",
          value: { type: "raw", code: "`padding-bottom: ${100 / ratio}%`" },
        },
        {
          frameworks: ["react"],
          name: "wrapperStyle",
          value: {
            type: "raw",
            code: "{ paddingBottom: `${100 / ratio}%` } as React.CSSProperties",
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
              value: {
                type: "classVariant",
                variant: "aspectRatioWrapper",
              },
            },
            { name: "style", value: { type: "variable", name: "wrapperStyle" } },
            { name: "data-slot", value: { type: "literal", value: "aspect-ratio-wrapper" } },
          ],
          children: [
            {
              type: "element",
              tag: "Tag",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "aspectRatio",
                    args: { class: "className" },
                  },
                },
                { name: "data-slot", value: { type: "literal", value: "aspect-ratio" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
  ],
};
