import { LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT } from "../package-requirements.js";
import type { StyledAdapterContract } from "../types.js";

export const carouselStyledContract: StyledAdapterContract = {
  component: "carousel",
  dependencies: {
    packages: [LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT],
    styledComponents: ["button"],
  },
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
      // Every root resets these inherited values, so nested parts use their own axis.
      base: [
        "group/carousel relative [--sw-carousel-outside:calc(var(--spacing)*-12)]",
        "[--sw-carousel-flow:row] [--sw-carousel-inline-gap:calc(var(--spacing)*4)] [--sw-carousel-block-gap:0px]",
        // Insets use CSS top/right/bottom/left order. Each vertical control anchors at left 50%.
        "[--sw-carousel-previous:50%_auto_auto_var(--sw-carousel-outside)] [--sw-carousel-next:50%_var(--sw-carousel-outside)_auto_auto]",
        "[--sw-carousel-shift:0_-50%] [--sw-carousel-turn:none] [--sw-carousel-icon-turn:none]",
        "rtl:data-[axis=x]:[--sw-carousel-previous:50%_var(--sw-carousel-outside)_auto_auto] rtl:data-[axis=x]:[--sw-carousel-next:50%_auto_auto_var(--sw-carousel-outside)] rtl:data-[axis=x]:[--sw-carousel-icon-turn:180deg]",
        "data-[axis=y]:[--sw-carousel-flow:column] data-[axis=y]:[--sw-carousel-inline-gap:0px] data-[axis=y]:[--sw-carousel-block-gap:calc(var(--spacing)*4)]",
        "data-[axis=y]:[--sw-carousel-previous:var(--sw-carousel-outside)_auto_auto_50%] data-[axis=y]:[--sw-carousel-next:auto_auto_var(--sw-carousel-outside)_50%]",
        "data-[axis=y]:[--sw-carousel-shift:-50%_0] data-[axis=y]:[--sw-carousel-turn:90deg]",
      ],
    },
    carouselContent: { base: "overflow-hidden" },
    carouselContainer: {
      base: "flex [flex-direction:var(--sw-carousel-flow)] -ms-(--sw-carousel-inline-gap) -mt-(--sw-carousel-block-gap)",
    },
    carouselItem: {
      base: "min-w-0 shrink-0 grow-0 basis-full ps-(--sw-carousel-inline-gap) pt-(--sw-carousel-block-gap)",
    },
    carouselNext: {
      base: "absolute inset-(--sw-carousel-next) size-8 [translate:var(--sw-carousel-shift)] rotate-(--sw-carousel-turn) rounded-full",
    },
    carouselPrevious: {
      base: "absolute inset-(--sw-carousel-previous) size-8 [translate:var(--sw-carousel-shift)] rotate-(--sw-carousel-turn) rounded-full",
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
            frameworks: ["react", "vue", "svelte"],
          },
          {
            name: "setApi",
            optional: true,
            type: '(api: import("@starwind-ui/runtime").CarouselInstance["api"]) => void',
            frameworks: ["react", "vue", "svelte"],
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
          { name: "plugins", frameworks: ["react", "vue", "svelte"] },
          { name: "setApi", frameworks: ["react", "vue", "svelte"] },
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
              frameworks: ["react", "vue", "svelte"],
            },
            {
              name: "setApi",
              value: { type: "variable", name: "setApi" },
              frameworks: ["react", "vue", "svelte"],
            },
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
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "literal",
                        value: "rotate-(--sw-carousel-icon-turn)",
                      },
                    },
                    { name: "aria-hidden", value: { type: "literal", value: true } },
                  ],
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
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "literal",
                        value: "rotate-(--sw-carousel-icon-turn)",
                      },
                    },
                    { name: "aria-hidden", value: { type: "literal", value: true } },
                  ],
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
