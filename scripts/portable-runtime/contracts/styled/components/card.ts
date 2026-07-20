import type { StyledAdapterContract } from "../types.js";

export const cardStyledContract: StyledAdapterContract = {
  component: "card",
  publicExports: [
    "Card",
    "CardAction",
    "CardContent",
    "CardDescription",
    "CardFooter",
    "CardHeader",
    "CardTitle",
  ],
  defaultExport: {
    Root: "Card",
    Header: "CardHeader",
    Footer: "CardFooter",
    Title: "CardTitle",
    Description: "CardDescription",
    Content: "CardContent",
    Action: "CardAction",
  },
  variantCollectionName: "CardVariants",
  variants: {
    card: {
      base: [
        "bg-card text-card-foreground group/card ring-border flex flex-col gap-(--card-spacing) rounded-xl py-(--card-spacing) ring-1",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
      ],
      variants: {
        size: {
          default: "[--card-spacing:--spacing(5)]",
          sm: "[--card-spacing:--spacing(4)] text-sm",
        },
      },
      defaultVariants: { size: "default" },
    },
    cardAction: {
      base: "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
    },
    cardContent: {
      base: "px-(--card-spacing)",
    },
    cardDescription: {
      base: "text-muted-foreground text-base group-data-[size=sm]/card:text-sm",
    },
    cardFooter: {
      base: "bg-muted/50 flex items-center rounded-b-xl border-t p-(--card-spacing)",
    },
    cardHeader: {
      base: [
        "@container/card-header grid auto-rows-min items-start gap-1 px-(--card-spacing)",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
      ],
    },
    cardTitle: {
      base: "font-heading text-xl leading-snug font-medium group-data-[size=sm]/card:text-base",
    },
  },
  components: [
    {
      exportName: "Card",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "card" },
        ],
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
          { name: "size", defaultValue: '"default"' },
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
            { name: "data-sw-card" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "card",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-size", value: { type: "variable", name: "size" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardHeader",
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
            { name: "data-sw-card-header" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardHeader",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-header" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardTitle",
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
            { name: "data-sw-card-title" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardDescription",
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
            { name: "data-sw-card-description" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardContent",
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
            { name: "data-sw-card-content" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardFooter",
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
            { name: "data-sw-card-footer" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardFooter",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-footer" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CardAction",
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
            { name: "data-sw-card-action" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "cardAction",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "card-action" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
