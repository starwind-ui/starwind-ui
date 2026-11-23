import type { StyledAdapterContract } from "../types.js";

export const aspectRatioStyledContract: StyledAdapterContract = {
  component: "aspect-ratio",
  publicExports: ["AspectRatio"],
  defaultExport: { Root: "AspectRatio" },
  defaultExportMode: "component",
  variantCollectionName: "AspectRatioVariants",
  variants: {
    aspectRatio: {
      base: "relative aspect-(--ratio)",
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
            name: "as",
            optional: true,
            type: "string",
            frameworks: ["vue"],
          },
          {
            name: "style",
            optional: true,
            type: 'import("vue").StyleValue',
            frameworks: ["vue"],
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
          { name: "style" },
        ],
        rest: "rest",
      },
      variables: [
        {
          frameworks: ["astro"],
          name: "ratioStyle",
          value: {
            type: "raw",
            code: 'typeof style === "string" ? `--ratio: ${ratio}; ${style}` : { "--ratio": ratio, ...style }',
          },
        },
        {
          frameworks: ["react"],
          name: "ratioStyle",
          value: {
            type: "raw",
            code: '{ "--ratio": ratio, ...style } as React.CSSProperties',
          },
        },
        {
          frameworks: ["vue"],
          name: "ratioStyle",
          value: { type: "raw", code: '[{ "--ratio": ratio }, style]' },
        },
        {
          frameworks: ["svelte"],
          name: "ratioStyle",
          value: { type: "raw", code: '`--ratio: ${ratio}; ${style ?? ""}`' },
        },
      ],
      render: [
        {
          type: "element",
          tag: "Tag",
          tagBinding: true,
          omitVoidChildrenIn: ["vue"],
          attrs: [
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "aspectRatio",
                args: { class: "className" },
              },
            },
            { name: "style", value: { type: "variable", name: "ratioStyle" } },
            { name: "data-slot", value: { type: "literal", value: "aspect-ratio" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
