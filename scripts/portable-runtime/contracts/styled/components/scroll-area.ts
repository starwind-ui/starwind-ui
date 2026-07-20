import type { StyledAdapterContract } from "../types.js";

const primitiveAlias = { "scroll-area": "ScrollAreaPrimitive" };

export const scrollAreaStyledContract: StyledAdapterContract = {
  component: "scroll-area",
  publicExports: [
    "ScrollArea",
    "ScrollAreaContent",
    "ScrollAreaCorner",
    "ScrollAreaThumb",
    "ScrollAreaViewport",
    "ScrollBar",
  ],
  defaultExport: {
    Root: "ScrollArea",
    Viewport: "ScrollAreaViewport",
    Content: "ScrollAreaContent",
    Scrollbar: "ScrollBar",
    Thumb: "ScrollAreaThumb",
    Corner: "ScrollAreaCorner",
  },
  variantCollectionName: "ScrollAreaVariants",
  styles: {
    importFrom: ["ScrollArea", "ScrollAreaViewport"],
    content: [
      "[data-sw-scroll-area-viewport] {",
      "  scrollbar-width: none;",
      "  -ms-overflow-style: none;",
      "}",
      "",
      "[data-sw-scroll-area-viewport]::-webkit-scrollbar {",
      "  display: none;",
      "}",
    ],
  },
  variants: {
    scrollArea: {
      base: "relative overflow-hidden",
    },
    scrollAreaViewport: {
      base: "focus-visible:ring-outline/50 size-full overflow-auto rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
    },
    scrollAreaContent: {
      base: "min-w-fit",
    },
    scrollAreaCorner: {
      base: "bg-background absolute end-0 bottom-0 z-10 hidden size-2.5",
    },
    scrollAreaScrollbar: {
      base: [
        "absolute z-10 flex touch-none p-px transition-colors select-none",
        "data-[orientation=horizontal]:inset-x-0 data-[orientation=horizontal]:bottom-0 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent",
        "data-[orientation=vertical]:inset-y-0 data-[orientation=vertical]:end-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent",
      ],
    },
    scrollAreaThumb: {
      base: "bg-border relative flex-1 rounded-full",
    },
  },
  components: [
    {
      exportName: "ScrollArea",
      primitiveAliases: primitiveAlias,
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "overflowEdgeThreshold", optional: true, type: "number" },
          { name: "viewportClass", optional: true, type: "string", frameworks: ["astro"] },
          { name: "viewportClass", optional: true, type: "string", frameworks: ["vue"] },
          { name: "viewportClassName", optional: true, type: "string", frameworks: ["react"] },
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
          { name: "overflowEdgeThreshold" },
          { name: "viewportClass", frameworks: ["astro"] },
          { name: "viewportClass", frameworks: ["vue"] },
          { name: "viewportClassName", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "scroll-area",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollArea",
                args: { class: "className" },
              },
            },
            {
              name: "overflowEdgeThreshold",
              value: { type: "variable", name: "overflowEdgeThreshold" },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "scroll-area" } },
          ],
          children: [
            {
              type: "primitive",
              component: "scroll-area",
              part: "Viewport",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "scrollAreaViewport",
                    args: { class: "viewportClass" },
                  },
                  frameworks: ["astro"],
                },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "scrollAreaViewport",
                    args: { class: "viewportClass" },
                  },
                  frameworks: ["vue"],
                },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "scrollAreaViewport",
                    args: { class: "viewportClassName" },
                  },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "scroll-area-viewport" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "scroll-area",
                  part: "Content",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "scrollAreaContent" },
                    },
                    { name: "data-slot", value: { type: "literal", value: "scroll-area-content" } },
                  ],
                  children: [{ type: "slot" }],
                },
              ],
            },
            {
              type: "slot",
              name: "scrollbar",
              fallback: [
                {
                  type: "primitive",
                  component: "scroll-area",
                  part: "Scrollbar",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "scrollAreaScrollbar" },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "scroll-area-scrollbar" },
                    },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "scroll-area",
                      part: "Thumb",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "scrollAreaThumb" },
                        },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "scroll-area-thumb" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "primitive",
              component: "scroll-area",
              part: "Corner",
              selfClosing: true,
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "scrollAreaCorner" } },
                { name: "data-slot", value: { type: "literal", value: "scroll-area-corner" } },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ScrollAreaViewport",
      primitiveAliases: primitiveAlias,
      props: {
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
          type: "primitive",
          component: "scroll-area",
          part: "Viewport",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollAreaViewport",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "scroll-area-viewport" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ScrollAreaContent",
      primitiveAliases: primitiveAlias,
      props: {
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
          type: "primitive",
          component: "scroll-area",
          part: "Content",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollAreaContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "scroll-area-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ScrollBar",
      primitiveAliases: primitiveAlias,
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "keepMounted", optional: true, type: "boolean" },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
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
          { name: "keepMounted", defaultValue: "false" },
          { name: "orientation", defaultValue: '"vertical"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "scroll-area",
          part: "Scrollbar",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollAreaScrollbar",
                args: { class: "className" },
              },
            },
            { name: "keepMounted", value: { type: "variable", name: "keepMounted" } },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-orientation", value: { type: "variable", name: "orientation" } },
            { name: "data-slot", value: { type: "literal", value: "scroll-area-scrollbar" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "primitive",
                  component: "scroll-area",
                  part: "Thumb",
                  selfClosing: true,
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "scrollAreaThumb" },
                    },
                    { name: "data-slot", value: { type: "literal", value: "scroll-area-thumb" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ScrollAreaThumb",
      primitiveAliases: primitiveAlias,
      props: {
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
          type: "primitive",
          component: "scroll-area",
          part: "Thumb",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollAreaThumb",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "scroll-area-thumb" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ScrollAreaCorner",
      primitiveAliases: primitiveAlias,
      props: {
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
          type: "primitive",
          component: "scroll-area",
          part: "Corner",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "scrollAreaCorner",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "scroll-area-corner" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
