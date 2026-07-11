import type { StyledAdapterContract, StyledComponentContract } from "../types.js";

type ItemPartOptions = {
  exportName: string;
  htmlElement?: string;
  role?: string;
  slot: string;
  tag?: string;
  variant: string;
};

const itemPart = ({
  exportName,
  htmlElement = "div",
  role,
  slot,
  tag = "div",
  variant,
}: ItemPartOptions): StyledComponentContract => ({
  exportName,
  props: {
    extends: [{ type: "htmlAttributes", element: htmlElement }],
    fields: [
      {
        name: "ref",
        optional: true,
        type: `React.Ref<${htmlElement === "p" ? "HTMLParagraphElement" : "HTMLDivElement"}>`,
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
      tag,
      attrs: [
        ...(role ? [{ name: "role", value: { type: "literal", value: role } } as const] : []),
        {
          name: "class",
          value: {
            type: "classVariant",
            variant,
            args: { class: "className" },
          },
        },
        { name: "spread", value: { type: "variable", name: "rest" } },
        { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
        { name: "data-slot", value: { type: "literal", value: slot } },
      ],
      children: [{ type: "slot" }],
    },
  ],
});

export const itemStyledContract: StyledAdapterContract = {
  component: "item",
  publicExports: [
    "Item",
    "ItemActions",
    "ItemContent",
    "ItemDescription",
    "ItemFooter",
    "ItemGroup",
    "ItemHeader",
    "ItemMedia",
    "ItemSeparator",
    "ItemTitle",
  ],
  defaultExport: {
    Root: "Item",
    Actions: "ItemActions",
    Content: "ItemContent",
    Description: "ItemDescription",
    Footer: "ItemFooter",
    Group: "ItemGroup",
    Header: "ItemHeader",
    Media: "ItemMedia",
    Separator: "ItemSeparator",
    Title: "ItemTitle",
  },
  variantCollectionName: "ItemVariants",
  variants: {
    item: {
      base: [
        "group/item flex flex-wrap items-center rounded-md border border-transparent text-sm transition-colors",
        "[a]:hover:bg-accent/50 [a]:transition-colors",
        "focus-visible:border-ring focus-visible:ring-outline/50 outline-none focus-visible:ring-[3px]",
      ],
      variants: {
        variant: {
          default: "bg-transparent",
          outline: "border-border",
          muted: "bg-muted/50",
        },
        size: {
          default: "gap-4 p-4",
          sm: "gap-2.5 px-4 py-3",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
    itemActions: {
      base: "flex items-center gap-2",
    },
    itemContent: {
      base: "flex flex-1 flex-col gap-1.5 [&+[data-slot=item-content]]:flex-none",
    },
    itemDescription: {
      base: [
        "text-muted-foreground line-clamp-2 leading-snug font-normal text-balance",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
      ],
    },
    itemFooter: {
      base: "flex basis-full items-center justify-between gap-2",
    },
    itemGroup: {
      base: "group/item-group flex flex-col",
    },
    itemHeader: {
      base: "flex basis-full items-center justify-between gap-2",
    },
    itemMedia: {
      base: [
        "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none",
        "group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start",
      ],
      variants: {
        variant: {
          default: "bg-transparent",
          icon: "bg-muted size-8 rounded-sm border [&_svg:not([class*='size-'])]:size-4",
          image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    },
    itemSeparator: {
      base: "my-0",
    },
    itemTitle: {
      base: "flex w-fit items-center gap-2 leading-snug font-medium",
    },
  },
  components: [
    {
      exportName: "Item",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "omitHtmlAttributes", element: "a", keys: ["type"] },
          { type: "variantProps", variant: "item" },
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
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"default"' },
          { name: "size", defaultValue: '"default"' },
          { name: "as", alias: "Tag", defaultValue: '"div"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "Tag",
          attrs: [
            { name: "data-sw-item" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "item",
                args: { variant: "variant", size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    itemPart({
      exportName: "ItemActions",
      slot: "item-actions",
      variant: "itemActions",
    }),
    itemPart({
      exportName: "ItemContent",
      slot: "item-content",
      variant: "itemContent",
    }),
    itemPart({
      exportName: "ItemDescription",
      htmlElement: "p",
      slot: "item-description",
      tag: "p",
      variant: "itemDescription",
    }),
    itemPart({
      exportName: "ItemFooter",
      slot: "item-footer",
      variant: "itemFooter",
    }),
    itemPart({
      exportName: "ItemGroup",
      role: "list",
      slot: "item-group",
      variant: "itemGroup",
    }),
    itemPart({
      exportName: "ItemHeader",
      slot: "item-header",
      variant: "itemHeader",
    }),
    {
      exportName: "ItemMedia",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "itemMedia" },
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
          { name: "variant", defaultValue: '"default"' },
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
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "itemMedia",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "data-variant", value: { type: "variable", name: "variant" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "item-media" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ItemSeparator",
      props: {
        extends: [{ type: "componentProps", component: "separator", exportName: "Separator" }],
      },
      destructure: {
        props: [
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "separator",
          exportName: "Separator",
          selfClosing: true,
          attrs: [
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "itemSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "item-separator" } },
          ],
        },
      ],
    },
    itemPart({
      exportName: "ItemTitle",
      slot: "item-title",
      variant: "itemTitle",
    }),
  ],
};
