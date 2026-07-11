import type { StyledAdapterContract } from "../types.js";

export const imageStyledContract: StyledAdapterContract = {
  component: "image",
  frameworks: ["astro"],
  publicExports: ["Image"],
  defaultExport: { Root: "Image" },
  defaultExportMode: "component",
  variantCollectionName: "ImageVariants",
  variants: {
    image: {
      base: "h-auto w-full",
    },
  },
  components: [
    {
      exportName: "Image",
      imports: [
        {
          frameworks: ["astro"],
          importName: "Image",
          localName: "AstroImage",
          source: "astro:assets",
          type: "named",
        },
      ],
      props: {
        declaration: "type",
        extends: [
          {
            code: 'Partial<import("astro/types").ComponentProps<typeof AstroImage>>',
            frameworks: ["astro"],
            type: "raw",
          },
        ],
        fields: [{ name: "inferSize", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "src" },
          { name: "alt", defaultValue: '""' },
          { name: "inferSize", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "conditional",
          condition: "src",
          then: [
            {
              type: "element",
              tag: "AstroImage",
              selfClosing: true,
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "image",
                    args: { class: "className" },
                  },
                },
                { name: "src", value: { type: "variable", name: "src" } },
                { name: "alt", value: { type: "variable", name: "alt" } },
                { name: "inferSize", value: { type: "variable", name: "inferSize" } },
                { name: "spread", value: { type: "raw", code: "(rest as any)" } },
                { name: "data-slot", value: { type: "literal", value: "image" } },
              ],
            },
          ],
          else: [],
        },
      ],
    },
  ],
};
