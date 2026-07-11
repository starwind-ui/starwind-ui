import type { StyledAdapterContract } from "../types.js";

export const alertStyledContract: StyledAdapterContract = {
  component: "alert",
  publicExports: ["Alert", "AlertDescription", "AlertTitle"],
  defaultExport: {
    Root: "Alert",
    Description: "AlertDescription",
    Title: "AlertTitle",
  },
  variantCollectionName: "AlertVariants",
  variants: {
    alert: {
      base: "text-foreground relative w-full rounded-lg border p-4",
      variants: {
        variant: {
          default: "bg-background dark:bg-input/30 [&>h5>svg]:text-foreground",
          primary: "border-primary bg-primary/7 [&>h5>svg]:text-primary",
          secondary: "border-secondary bg-secondary/7 [&>h5>svg]:text-secondary",
          info: "border-info bg-info/7 [&>h5>svg]:text-info",
          success: "border-success bg-success/7 [&>h5>svg]:text-success",
          warning: "border-warning bg-warning/7 [&>h5>svg]:text-warning",
          error: "border-error bg-error/7 [&>h5>svg]:text-error",
        },
      },
      defaultVariants: { variant: "default" },
    },
    alertDescription: { base: "leading-relaxed" },
    alertTitle: {
      base: "font-heading mb-2 flex items-center gap-2 text-lg leading-none font-medium tracking-tight",
    },
  },
  components: [
    {
      exportName: "Alert",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "alert" },
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
          { name: "variant" },
          { name: "role" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "inferredRole",
          value: {
            type: "raw",
            code: 'role ?? (variant === "error" || variant === "warning" ? "alert" : "status")',
          },
        },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "data-sw-alert" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alert",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "role", value: { type: "variable", name: "inferredRole" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "alert" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertTitle",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "h5" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLHeadingElement>",
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
          tag: "h5",
          attrs: [
            { name: "data-sw-alert-title" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alertTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "alert-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDescription",
      props: {
        declaration: "interface",
        extends: [{ type: "htmlAttributes", element: "p" }],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLParagraphElement>",
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
          tag: "p",
          attrs: [
            { name: "data-sw-alert-description" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alertDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "alert-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
