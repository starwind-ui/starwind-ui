import type { StyledAdapterContract } from "../types.js";

export const kbdStyledContract: StyledAdapterContract = {
  component: "kbd",
  publicExports: ["Kbd", "KbdGroup"],
  defaultExport: { Root: "Kbd", Group: "KbdGroup" },
  variantCollectionName: "KbdVariants",
  variants: {
    kbd: {
      base: [
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none",
        "bg-muted text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
      ],
    },
    kbdGroup: {
      base: "inline-flex items-center gap-1",
    },
  },
  components: [
    {
      exportName: "Kbd",
      props: {
        extends: [{ type: "htmlAttributes", element: "kbd" }],
        fields: [
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
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "kbd",
          attrs: [
            { name: "data-sw-kbd" },
            {
              name: "class",
              value: { type: "classVariant", variant: "kbd", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "kbd" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "KbdGroup",
      props: {
        extends: [{ type: "htmlAttributes", element: "kbd" }],
        fields: [
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
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "kbd",
          attrs: [
            { name: "data-sw-kbd-group" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "kbdGroup",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "kbd-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
