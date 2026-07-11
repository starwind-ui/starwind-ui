import { proseStyles } from "../styles/prose.js";
import type { StyledAdapterContract } from "../types.js";

export const proseStyledContract: StyledAdapterContract = {
  component: "prose",
  publicExports: ["Prose"],
  defaultExport: { Root: "Prose" },
  defaultExportMode: "component",
  variantCollectionName: "ProseVariants",
  styles: {
    content: proseStyles,
    importFrom: ["Prose"],
  },
  variants: {
    prose: {
      base: "sw-prose max-w-[65ch]",
    },
  },
  components: [
    {
      exportName: "Prose",
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
          type: "element",
          tag: "div",
          attrs: [
            { name: "data-sw-prose" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "prose",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "prose" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
