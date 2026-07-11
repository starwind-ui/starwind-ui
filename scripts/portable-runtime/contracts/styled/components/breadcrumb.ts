import type { StyledAdapterContract } from "../types.js";

export const breadcrumbStyledContract: StyledAdapterContract = {
  component: "breadcrumb",
  publicExports: [
    "Breadcrumb",
    "BreadcrumbEllipsis",
    "BreadcrumbItem",
    "BreadcrumbLink",
    "BreadcrumbList",
    "BreadcrumbPage",
    "BreadcrumbSeparator",
  ],
  defaultExport: {
    Root: "Breadcrumb",
    List: "BreadcrumbList",
    Ellipsis: "BreadcrumbEllipsis",
    Item: "BreadcrumbItem",
    Link: "BreadcrumbLink",
    Separator: "BreadcrumbSeparator",
    Page: "BreadcrumbPage",
  },
  variantCollectionName: "BreadcrumbVariants",
  variants: {
    breadcrumbEllipsis: {
      base: "flex size-6 items-center justify-center [&>svg]:size-4",
    },
    breadcrumbItem: { base: "inline-flex items-center gap-1.5" },
    breadcrumbLink: { base: "hover:text-foreground transition-colors" },
    breadcrumbList: {
      base: "text-muted-foreground flex flex-wrap items-center gap-1.5 wrap-break-word sm:gap-2",
    },
    breadcrumbPage: { base: "text-foreground font-normal" },
    breadcrumbSeparator: { base: "[&>svg]:size-4" },
  },
  components: [
    {
      exportName: "Breadcrumb",
      props: {
        declaration: "interface",
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
            { name: "data-sw-breadcrumb" },
            { name: "aria-label", value: { type: "literal", value: "breadcrumb" } },
            { name: "class", value: { type: "variable", name: "className" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "BreadcrumbList",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "ol" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLOListElement>",
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
          tag: "ol",
          attrs: [
            { name: "data-sw-breadcrumb-list" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "breadcrumbList",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb-list" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "BreadcrumbItem",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "li" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLLIElement>",
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
          tag: "li",
          attrs: [
            { name: "data-sw-breadcrumb-item" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "breadcrumbItem",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "BreadcrumbLink",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "a" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
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
          { name: "asChild", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "conditional",
          condition: "asChild",
          then: [{ type: "slot" }],
          else: [
            {
              type: "element",
              tag: "a",
              attrs: [
                { name: "data-sw-breadcrumb-link" },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "breadcrumbLink",
                    args: { class: "className" },
                  },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "ref",
                  value: { type: "variable", name: "ref" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "breadcrumb-link" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "BreadcrumbPage",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "span" }],
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
            { name: "data-sw-breadcrumb-page" },
            { name: "role", value: { type: "literal", value: "link" } },
            { name: "aria-disabled", value: { type: "literal", value: "true" } },
            { name: "aria-current", value: { type: "literal", value: "page" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "breadcrumbPage",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb-page" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "BreadcrumbSeparator",
      imports: [
        {
          type: "default",
          importName: "ChevronRight",
          source: "@tabler/icons/outline/chevron-right.svg",
        },
      ],
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "li" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLLIElement>",
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
          tag: "li",
          attrs: [
            { name: "data-sw-breadcrumb-separator" },
            { name: "role", value: { type: "literal", value: "presentation" } },
            { name: "aria-hidden", value: { type: "literal", value: "true" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "breadcrumbSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb-separator" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [{ type: "icon", importName: "ChevronRight" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "BreadcrumbEllipsis",
      imports: [{ type: "default", importName: "Dots", source: "@tabler/icons/outline/dots.svg" }],
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "span" }],
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
            { name: "data-sw-breadcrumb-ellipsis" },
            { name: "role", value: { type: "literal", value: "presentation" } },
            { name: "aria-hidden", value: { type: "literal", value: "true" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "breadcrumbEllipsis",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "breadcrumb-ellipsis" } },
          ],
          children: [
            { type: "slot", name: "icon", fallback: [{ type: "icon", importName: "Dots" }] },
            {
              type: "slot",
              fallback: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                  children: [{ type: "text", value: "More" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
