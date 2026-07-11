import type { StyledAdapterContract } from "../types.js";

export const carouselStyledContract: StyledAdapterContract = {
  component: "carousel",
  dependencies: { styledComponents: ["button"] },
  publicExports: [
    "Carousel",
    "CarouselContent",
    "CarouselItem",
    "CarouselNext",
    "CarouselPrevious",
  ],
  defaultExport: {
    Root: "Carousel",
    Content: "CarouselContent",
    Item: "CarouselItem",
    Next: "CarouselNext",
    Previous: "CarouselPrevious",
  },
  variantCollectionName: "CarouselVariants",
  variantAliases: {
    carouselControl: {
      defaultVariants: {
        variant: "outline",
        size: "icon",
      },
      importName: "button",
      localName: "buttonVariants",
      source: "../button/variants",
    },
  },
  variants: {
    carousel: {
      base: "group/carousel relative",
    },
    carouselContent: {
      base: "overflow-hidden",
    },
    carouselContainer: {
      base: [
        "flex group-data-[axis=y]/carousel:flex-col",
        "group-data-[axis=x]/carousel:-ml-4",
        "group-data-[axis=y]/carousel:-mt-4",
      ],
    },
    carouselItem: {
      base: [
        "min-w-0 shrink-0 grow-0 basis-full",
        "group-data-[axis=x]/carousel:pl-4",
        "group-data-[axis=y]/carousel:pt-4",
      ],
    },
    carouselNext: {
      base: [
        "absolute size-8 rounded-full",
        "group-data-[axis=x]/carousel:top-1/2 group-data-[axis=x]/carousel:-right-12 group-data-[axis=x]/carousel:-translate-y-1/2",
        "group-data-[axis=y]/carousel:-bottom-12 group-data-[axis=y]/carousel:left-1/2 group-data-[axis=y]/carousel:-translate-x-1/2 group-data-[axis=y]/carousel:rotate-90",
      ],
    },
    carouselPrevious: {
      base: [
        "absolute size-8 rounded-full",
        "group-data-[axis=x]/carousel:top-1/2 group-data-[axis=x]/carousel:-left-12 group-data-[axis=x]/carousel:-translate-y-1/2",
        "group-data-[axis=y]/carousel:-top-12 group-data-[axis=y]/carousel:left-1/2 group-data-[axis=y]/carousel:-translate-x-1/2 group-data-[axis=y]/carousel:rotate-90",
      ],
    },
  },
  components: [
    {
      exportName: "Carousel",
      primitiveAliases: { carousel: "CarouselPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          {
            name: "opts",
            optional: true,
            type: 'import("@starwind-ui/runtime").CarouselOptions["opts"]',
          },
          {
            name: "plugins",
            optional: true,
            type: 'import("@starwind-ui/runtime").CarouselOptions["plugins"]',
            frameworks: ["react"],
          },
          {
            name: "setApi",
            optional: true,
            type: '(api: import("@starwind-ui/runtime").CarouselInstance["api"]) => void',
            frameworks: ["react"],
          },
          {
            name: "autoInit",
            optional: true,
            type: "boolean",
            frameworks: ["astro"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "opts" },
          { name: "plugins", frameworks: ["react"] },
          { name: "setApi", frameworks: ["react"] },
          { name: "autoInit", frameworks: ["astro"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "carousel",
          part: "Root",
          attrs: [
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            { name: "opts", value: { type: "variable", name: "opts" } },
            {
              name: "plugins",
              value: { type: "variable", name: "plugins" },
              frameworks: ["react"],
            },
            { name: "setApi", value: { type: "variable", name: "setApi" }, frameworks: ["react"] },
            {
              name: "autoInit",
              value: { type: "variable", name: "autoInit" },
              frameworks: ["astro"],
            },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "carousel",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "carousel" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CarouselContent",
      primitiveAliases: { carousel: "CarouselPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "carousel",
          part: "Viewport",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "carouselContent",
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "carousel-content" } },
          ],
          children: [
            {
              type: "primitive",
              component: "carousel",
              part: "Container",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "carouselContainer",
                    args: { class: "className" },
                  },
                },
                { name: "data-slot", value: { type: "literal", value: "carousel-container" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "CarouselItem",
      primitiveAliases: { carousel: "CarouselPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "carousel",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "carouselItem",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "carousel-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "CarouselPrevious",
      primitiveAliases: { carousel: "CarouselPrimitive" },
      imports: [
        {
          type: "default",
          importName: "ChevronLeft",
          source: "@tabler/icons/outline/chevron-left.svg",
        },
      ],
      props: {
        extends: [
          { type: "htmlAttributes", element: "button" },
          { type: "variantProps", variant: "carouselControl" },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"outline"' },
          { name: "size", defaultValue: '"icon"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "controlClassName",
          value: {
            type: "classVariant",
            variant: "carouselPrevious",
            args: { class: "className" },
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "carousel",
          part: "Previous",
          attrs: [
            { name: "aria-label", value: { type: "literal", value: "Previous slide" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "carouselControl",
                args: { variant: "variant", size: "size", class: "controlClassName" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "carousel-previous" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronLeft",
                  attrs: [{ name: "aria-hidden", value: { type: "literal", value: true } }],
                },
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                  children: [{ type: "text", value: "Previous slide" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "CarouselNext",
      primitiveAliases: { carousel: "CarouselPrimitive" },
      imports: [
        {
          type: "default",
          importName: "ChevronRight",
          source: "@tabler/icons/outline/chevron-right.svg",
        },
      ],
      props: {
        extends: [
          { type: "htmlAttributes", element: "button" },
          { type: "variantProps", variant: "carouselControl" },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"outline"' },
          { name: "size", defaultValue: '"icon"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "controlClassName",
          value: {
            type: "classVariant",
            variant: "carouselNext",
            args: { class: "className" },
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "carousel",
          part: "Next",
          attrs: [
            { name: "aria-label", value: { type: "literal", value: "Next slide" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "carouselControl",
                args: { variant: "variant", size: "size", class: "controlClassName" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "carousel-next" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronRight",
                  attrs: [{ name: "aria-hidden", value: { type: "literal", value: true } }],
                },
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                  children: [{ type: "text", value: "Next slide" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
