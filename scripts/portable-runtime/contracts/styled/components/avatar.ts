import type { StyledAdapterContract } from "../types.js";

export const avatarStyledContract: StyledAdapterContract = {
  component: "avatar",
  publicExports: ["Avatar", "AvatarFallback", "AvatarImage"],
  defaultExport: {
    Root: "Avatar",
    Image: "AvatarImage",
    Fallback: "AvatarFallback",
  },
  variantCollectionName: "AvatarVariants",
  variants: {
    avatar: {
      base: "text-foreground bg-muted relative inline-flex overflow-hidden rounded-full border-2",
      variants: {
        variant: {
          default: "border-border",
          primary: "border-primary",
          secondary: "border-secondary",
          info: "border-info",
          success: "border-success",
          warning: "border-warning",
          error: "border-error",
        },
        size: {
          sm: "h-8 w-8 text-xs",
          md: "h-10 w-10 text-sm",
          lg: "h-12 w-12 text-base",
        },
      },
      defaultVariants: { variant: "default", size: "md" },
    },
    avatarFallback: {
      base: "absolute inset-0.5 flex items-center justify-center rounded-full font-medium",
    },
    avatarImage: { base: "relative z-1 h-full w-full object-cover" },
  },
  components: [
    {
      exportName: "Avatar",
      primitiveAliases: { avatar: "AvatarPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "span" },
          { type: "variantProps", variant: "avatar" },
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
          { name: "variant" },
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "avatar",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "avatar",
                args: { variant: "variant", size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "avatar" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AvatarImage",
      primitiveAliases: { avatar: "AvatarPrimitive" },
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "img", keys: ["children"] }],
        fields: [
          { name: "alt", type: "string" },
          { name: "src", optional: true, type: "string", frameworks: ["astro"] },
          { name: "image", optional: true, type: "ImageMetadata", frameworks: ["astro"] },
          {
            name: "onLoadingStatusChange",
            optional: true,
            type: '(status: import("@starwind-ui/runtime").AvatarImageLoadingStatus, details: import("@starwind-ui/runtime").AvatarLoadingStatusChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onLoadingStatusChange",
            optional: true,
            type: '(status: import("@starwind-ui/vue/avatar").AvatarImageLoadingStatus, details: import("@starwind-ui/vue/avatar").AvatarLoadingStatusChangeDetails) => void',
            frameworks: ["vue"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLImageElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "alt", frameworks: ["vue"] },
          { name: "onLoadingStatusChange", frameworks: ["react"] },
          { name: "onLoadingStatusChange", frameworks: ["vue"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "avatar",
          part: "Image",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "avatarImage",
                args: { class: "className" },
              },
            },
            {
              name: "onLoadingStatusChange",
              value: { type: "variable", name: "onLoadingStatusChange" },
              frameworks: ["react"],
            },
            {
              name: "onLoadingStatusChange",
              value: { type: "variable", name: "onLoadingStatusChange" },
              frameworks: ["vue"],
            },
            { name: "alt", value: { type: "variable", name: "alt" }, frameworks: ["vue"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "avatar-image" } },
          ],
        },
      ],
    },
    {
      exportName: "AvatarFallback",
      primitiveAliases: { avatar: "AvatarPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "span" }],
        fields: [
          { name: "delay", optional: true, type: "number" },
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
          { name: "delay" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "avatar",
          part: "Fallback",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "avatarFallback",
                args: { class: "className" },
              },
            },
            { name: "delay", value: { type: "variable", name: "delay" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "data-slot", value: { type: "literal", value: "avatar-fallback" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
