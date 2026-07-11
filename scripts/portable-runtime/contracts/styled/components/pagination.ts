import type { StyledAdapterContract, StyledComponentContract } from "../types.js";

const chevronLeftImport = {
  importName: "ChevronLeft",
  source: "@tabler/icons/outline/chevron-left.svg",
  type: "default",
} as const;

const chevronRightImport = {
  importName: "ChevronRight",
  source: "@tabler/icons/outline/chevron-right.svg",
  type: "default",
} as const;

const dotsImport = {
  importName: "Dots",
  source: "@tabler/icons/outline/dots.svg",
  type: "default",
} as const;

function paginationPart(
  exportName: string,
  element: string,
  slot: string,
  variant?: string,
): StyledComponentContract {
  return {
    exportName,
    props: {
      extends: [{ type: "htmlAttributes", element }],
      fields: [
        {
          name: "ref",
          optional: true,
          type: `React.Ref<${element === "ul" ? "HTMLUListElement" : element === "li" ? "HTMLLIElement" : "HTMLElement"}>`,
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
        tag: element,
        attrs: [
          {
            name: "class",
            value: variant
              ? {
                  type: "classVariant",
                  variant,
                  args: { class: "className" },
                }
              : { type: "variable", name: "className" },
          },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: slot } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

export const paginationStyledContract: StyledAdapterContract = {
  component: "pagination",
  publicExports: [
    "Pagination",
    "PaginationContent",
    "PaginationEllipsis",
    "PaginationItem",
    "PaginationLink",
    "PaginationNext",
    "PaginationPrevious",
  ],
  defaultExport: {
    Root: "Pagination",
    Content: "PaginationContent",
    Ellipsis: "PaginationEllipsis",
    Item: "PaginationItem",
    Link: "PaginationLink",
    Next: "PaginationNext",
    Previous: "PaginationPrevious",
  },
  variantCollectionName: "PaginationVariants",
  variants: {
    pagination: { base: "mx-auto flex w-full justify-center" },
    paginationContent: { base: "flex flex-row items-center gap-1" },
    paginationEllipsis: {
      base: "flex items-center justify-center",
      variants: {
        size: {
          "icon-sm": "size-9",
          icon: "size-11",
          "icon-lg": "size-12",
        },
      },
      defaultVariants: { size: "icon" },
    },
    paginationNext: { base: "group gap-1" },
    paginationPrevious: { base: "group gap-1" },
  },
  components: [
    {
      exportName: "Pagination",
      props: {
        extends: [{ type: "htmlAttributes", element: "nav" }],
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
          tag: "nav",
          attrs: [
            { name: "role", value: { type: "literal", value: "navigation" } },
            { name: "aria-label", value: { type: "literal", value: "pagination" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "pagination",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "pagination" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    paginationPart("PaginationContent", "ul", "pagination-content", "paginationContent"),
    paginationPart("PaginationItem", "li", "pagination-item"),
    {
      exportName: "PaginationLink",
      props: {
        extends: [
          {
            type: "componentProps",
            component: "button",
            exportName: "Button",
            keys: ["variant", "as", "ref"],
          },
        ],
        fields: [
          { name: "isActive", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLAnchorElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "isActive" },
          { name: "size", defaultValue: '"icon"' },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"pagination-link"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "button",
          exportName: "Button",
          attrs: [
            {
              name: "aria-current",
              value: { type: "raw", code: 'isActive ? "page" : undefined' },
            },
            {
              name: "variant",
              value: { type: "raw", code: 'isActive ? "outline" : "ghost"' },
            },
            { name: "size", value: { type: "variable", name: "size" } },
            { name: "class", value: { type: "variable", name: "className" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "as", value: { type: "literal", value: "a" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PaginationPrevious",
      imports: [chevronLeftImport],
      props: {
        extends: [
          { type: "componentProps", component: "pagination", exportName: "PaginationLink" },
        ],
      },
      destructure: {
        props: [
          { name: "size", defaultValue: '"md"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "pagination",
          exportName: "PaginationLink",
          attrs: [
            { name: "aria-label", value: { type: "literal", value: "Go to previous page" } },
            { name: "size", value: { type: "variable", name: "size" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "paginationPrevious",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "pagination-previous" } },
          ],
          children: [
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronLeft",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "literal",
                        value: "size-4 transition-transform group-hover:-translate-x-1",
                      },
                    },
                  ],
                },
              ],
            },
            { type: "slot" },
          ],
        },
      ],
    },
    {
      exportName: "PaginationNext",
      imports: [chevronRightImport],
      props: {
        extends: [
          { type: "componentProps", component: "pagination", exportName: "PaginationLink" },
        ],
      },
      destructure: {
        props: [
          { name: "size", defaultValue: '"md"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "pagination",
          exportName: "PaginationLink",
          attrs: [
            { name: "aria-label", value: { type: "literal", value: "Go to next page" } },
            { name: "size", value: { type: "variable", name: "size" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "paginationNext",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "pagination-next" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronRight",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "literal",
                        value: "size-4 transition-transform group-hover:translate-x-1",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "PaginationEllipsis",
      imports: [dotsImport],
      props: {
        extends: [
          { type: "htmlAttributes", element: "span" },
          { type: "variantProps", variant: "paginationEllipsis" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLSpanElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "span",
          attrs: [
            { name: "aria-hidden" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "paginationEllipsis",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "pagination-ellipsis" } },
          ],
          children: [
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "Dots",
                  attrs: [{ name: "class", value: { type: "literal", value: "size-4" } }],
                },
              ],
            },
            {
              type: "slot",
              fallback: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                  children: [{ type: "text", value: "More pages" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
