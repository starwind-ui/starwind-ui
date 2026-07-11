import type { StyledAdapterContract } from "../types.js";

export const badgeStyledContract: StyledAdapterContract = {
  component: "badge",
  publicExports: ["Badge"],
  defaultExport: { Root: "Badge" },
  defaultExportMode: "component",
  variantCollectionName: "BadgeVariants",
  variants: {
    badge: {
      base: [
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "transition-all outline-none focus-visible:ring-3",
        "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
      ],
      variants: {
        variant: {
          default: "bg-foreground text-background focus-visible:ring-outline/50",
          primary: "bg-primary text-primary-foreground focus-visible:ring-primary/50",
          secondary: "bg-secondary text-secondary-foreground focus-visible:ring-secondary/50",
          outline:
            "border-border focus-visible:border-outline focus-visible:ring-outline/50 border",
          ghost: "bg-foreground/10 text-foreground focus-visible:ring-outline/50",
          info: "bg-info text-info-foreground focus-visible:ring-info/50",
          success: "bg-success text-success-foreground focus-visible:ring-success/50",
          warning: "bg-warning text-warning-foreground focus-visible:ring-warning/50",
          error: "bg-error text-error-foreground focus-visible:ring-error/50",
        },
        tone: {
          neutral: "",
          primary: "",
          "primary-accent": "",
          secondary: "",
          "secondary-accent": "",
          info: "",
          success: "",
          warning: "",
          error: "",
        },
        appearance: {
          solid: "",
          soft: "",
          outline: "",
          text: "",
          frosted: "",
        },
        eyebrow: { true: "uppercase tracking-wider", false: "" },
        size: {
          sm: "px-2.5 py-0.5 text-xs [&_svg:not([class*='size-'])]:size-3",
          md: "px-3 py-0.5 text-sm [&_svg:not([class*='size-'])]:size-4",
          lg: "px-4 py-1 text-base [&_svg:not([class*='size-'])]:size-4.5",
        },
        isLink: { true: "cursor-pointer", false: "" },
      },
      compoundVariants: [
        { isLink: true, variant: "default", className: "hover:bg-foreground/80" },
        { isLink: true, variant: "primary", className: "hover:bg-primary/80" },
        { isLink: true, variant: "secondary", className: "hover:bg-secondary/80" },
        { isLink: true, variant: "outline", className: "hover:border-border/80" },
        { isLink: true, variant: "ghost", className: "hover:bg-foreground/7" },
        { isLink: true, variant: "info", className: "hover:bg-info/80" },
        { isLink: true, variant: "success", className: "hover:bg-success/80" },
        { isLink: true, variant: "warning", className: "hover:bg-warning/80" },
        { isLink: true, variant: "error", className: "hover:bg-error/80" },
        { isLink: true, appearance: "frosted", className: "hover:bg-background/90" },
        { isLink: true, appearance: "text", className: "hover:underline underline-offset-4" },
        {
          isLink: true,
          tone: "neutral",
          appearance: "solid",
          className: "hover:bg-foreground/80",
        },
        {
          isLink: true,
          tone: "primary",
          appearance: "solid",
          className: "hover:bg-primary/80",
        },
        {
          isLink: true,
          tone: "primary-accent",
          appearance: "solid",
          className: "hover:bg-primary-accent/80",
        },
        {
          isLink: true,
          tone: "secondary",
          appearance: "solid",
          className: "hover:bg-secondary/80",
        },
        {
          isLink: true,
          tone: "secondary-accent",
          appearance: "solid",
          className: "hover:bg-secondary-accent/80",
        },
        {
          isLink: true,
          tone: "info",
          appearance: "solid",
          className: "hover:bg-info/80",
        },
        {
          isLink: true,
          tone: "success",
          appearance: "solid",
          className: "hover:bg-success/80",
        },
        {
          isLink: true,
          tone: "warning",
          appearance: "solid",
          className: "hover:bg-warning/80",
        },
        {
          isLink: true,
          tone: "error",
          appearance: "solid",
          className: "hover:bg-error/80",
        },
        {
          isLink: true,
          tone: "neutral",
          appearance: "soft",
          className: "hover:bg-foreground/20",
        },
        {
          isLink: true,
          tone: "primary",
          appearance: "soft",
          className: "hover:bg-primary/20",
        },
        {
          isLink: true,
          tone: "primary-accent",
          appearance: "soft",
          className: "hover:bg-primary-accent/20",
        },
        {
          isLink: true,
          tone: "secondary",
          appearance: "soft",
          className: "hover:bg-secondary/20",
        },
        {
          isLink: true,
          tone: "secondary-accent",
          appearance: "soft",
          className: "hover:bg-secondary-accent/20",
        },
        {
          isLink: true,
          tone: "info",
          appearance: "soft",
          className: "hover:bg-info/20",
        },
        {
          isLink: true,
          tone: "success",
          appearance: "soft",
          className: "hover:bg-success/20",
        },
        {
          isLink: true,
          tone: "warning",
          appearance: "soft",
          className: "hover:bg-warning/20",
        },
        {
          isLink: true,
          tone: "error",
          appearance: "soft",
          className: "hover:bg-error/20",
        },
        {
          isLink: true,
          tone: "neutral",
          appearance: "outline",
          className: "hover:bg-foreground/10",
        },
        {
          isLink: true,
          tone: "primary",
          appearance: "outline",
          className: "hover:bg-primary/10",
        },
        {
          isLink: true,
          tone: "primary-accent",
          appearance: "outline",
          className: "hover:bg-primary-accent/10",
        },
        {
          isLink: true,
          tone: "secondary",
          appearance: "outline",
          className: "hover:bg-secondary/10",
        },
        {
          isLink: true,
          tone: "secondary-accent",
          appearance: "outline",
          className: "hover:bg-secondary-accent/10",
        },
        {
          isLink: true,
          tone: "info",
          appearance: "outline",
          className: "hover:bg-info/10",
        },
        {
          isLink: true,
          tone: "success",
          appearance: "outline",
          className: "hover:bg-success/10",
        },
        {
          isLink: true,
          tone: "warning",
          appearance: "outline",
          className: "hover:bg-warning/10",
        },
        {
          isLink: true,
          tone: "error",
          appearance: "outline",
          className: "hover:bg-error/10",
        },
        {
          tone: "neutral",
          appearance: "solid",
          className: "bg-foreground text-background focus-visible:ring-outline/50",
        },
        {
          tone: "primary",
          appearance: "solid",
          className: "bg-primary text-primary-foreground focus-visible:ring-primary/50",
        },
        {
          tone: "primary-accent",
          appearance: "solid",
          className: "bg-primary-accent text-background focus-visible:ring-primary-accent/50",
        },
        {
          tone: "secondary",
          appearance: "solid",
          className: "bg-secondary text-secondary-foreground focus-visible:ring-secondary/50",
        },
        {
          tone: "secondary-accent",
          appearance: "solid",
          className: "bg-secondary-accent text-background focus-visible:ring-secondary-accent/50",
        },
        {
          tone: "info",
          appearance: "solid",
          className: "bg-info text-info-foreground focus-visible:ring-info/50",
        },
        {
          tone: "success",
          appearance: "solid",
          className: "bg-success text-success-foreground focus-visible:ring-success/50",
        },
        {
          tone: "warning",
          appearance: "solid",
          className: "bg-warning text-warning-foreground focus-visible:ring-warning/50",
        },
        {
          tone: "error",
          appearance: "solid",
          className: "bg-error text-error-foreground focus-visible:ring-error/50",
        },
        {
          tone: "neutral",
          appearance: "soft",
          className: "bg-foreground/10 text-foreground focus-visible:ring-outline/50",
        },
        {
          tone: "primary",
          appearance: "soft",
          className: "bg-primary/10 text-foreground focus-visible:ring-primary/50",
        },
        {
          tone: "primary-accent",
          appearance: "soft",
          className:
            "bg-primary-accent/10 text-primary-accent focus-visible:ring-primary-accent/50",
        },
        {
          tone: "secondary",
          appearance: "soft",
          className: "bg-secondary/10 text-foreground focus-visible:ring-secondary/50",
        },
        {
          tone: "secondary-accent",
          appearance: "soft",
          className:
            "bg-secondary-accent/10 text-secondary-accent focus-visible:ring-secondary-accent/50",
        },
        {
          tone: "info",
          appearance: "soft",
          className: "bg-info/10 text-foreground focus-visible:ring-info/50",
        },
        {
          tone: "success",
          appearance: "soft",
          className: "bg-success/10 text-foreground focus-visible:ring-success/50",
        },
        {
          tone: "warning",
          appearance: "soft",
          className: "bg-warning/10 text-foreground focus-visible:ring-warning/50",
        },
        {
          tone: "error",
          appearance: "soft",
          className: "bg-error/10 text-foreground focus-visible:ring-error/50",
        },
        {
          tone: "neutral",
          appearance: "outline",
          className: "border border-border text-foreground focus-visible:ring-outline/50",
        },
        {
          tone: "primary",
          appearance: "outline",
          className: "border border-primary text-foreground focus-visible:ring-primary/50",
        },
        {
          tone: "primary-accent",
          appearance: "outline",
          className:
            "border border-primary-accent text-primary-accent focus-visible:ring-primary-accent/50",
        },
        {
          tone: "secondary",
          appearance: "outline",
          className:
            "border border-secondary text-secondary-foreground focus-visible:ring-secondary/50",
        },
        {
          tone: "secondary-accent",
          appearance: "outline",
          className:
            "border border-secondary-accent text-secondary-accent focus-visible:ring-secondary-accent/50",
        },
        {
          tone: "info",
          appearance: "outline",
          className: "border border-info text-foreground focus-visible:ring-info/50",
        },
        {
          tone: "success",
          appearance: "outline",
          className: "border border-success text-foreground focus-visible:ring-success/50",
        },
        {
          tone: "warning",
          appearance: "outline",
          className: "border border-warning text-foreground focus-visible:ring-warning/50",
        },
        {
          tone: "error",
          appearance: "outline",
          className: "border border-error text-foreground focus-visible:ring-error/50",
        },
        {
          appearance: "text",
          className: "rounded-none border-0 bg-transparent p-0 shadow-none",
        },
        {
          tone: "neutral",
          appearance: "text",
          className: "text-foreground focus-visible:ring-outline/50",
        },
        {
          tone: "primary",
          appearance: "text",
          className: "text-primary focus-visible:ring-primary/50",
        },
        {
          tone: "primary-accent",
          appearance: "text",
          className: "text-primary-accent focus-visible:ring-primary-accent/50",
        },
        {
          tone: "secondary",
          appearance: "text",
          className: "text-secondary-foreground focus-visible:ring-secondary/50",
        },
        {
          tone: "secondary-accent",
          appearance: "text",
          className: "text-secondary-accent focus-visible:ring-secondary-accent/50",
        },
        {
          tone: "info",
          appearance: "text",
          className: "text-info focus-visible:ring-info/50",
        },
        {
          tone: "success",
          appearance: "text",
          className: "text-success focus-visible:ring-success/50",
        },
        {
          tone: "warning",
          appearance: "text",
          className: "text-warning focus-visible:ring-warning/50",
        },
        {
          tone: "error",
          appearance: "text",
          className: "text-error focus-visible:ring-error/50",
        },
        {
          appearance: "frosted",
          className: "border bg-background/80 shadow-sm backdrop-blur-sm",
        },
        {
          tone: "neutral",
          appearance: "frosted",
          className: "border-border/60 text-foreground focus-visible:ring-outline/50",
        },
        {
          tone: "primary",
          appearance: "frosted",
          className: "border-primary/40 text-foreground focus-visible:ring-primary/50",
        },
        {
          tone: "primary-accent",
          appearance: "frosted",
          className:
            "border-primary-accent/40 text-primary-accent focus-visible:ring-primary-accent/50",
        },
        {
          tone: "secondary",
          appearance: "frosted",
          className:
            "border-secondary/60 text-secondary-foreground focus-visible:ring-secondary/50",
        },
        {
          tone: "secondary-accent",
          appearance: "frosted",
          className:
            "border-secondary-accent/40 text-secondary-accent focus-visible:ring-secondary-accent/50",
        },
        {
          tone: "info",
          appearance: "frosted",
          className: "border-info/40 text-foreground focus-visible:ring-info/50",
        },
        {
          tone: "success",
          appearance: "frosted",
          className: "border-success/40 text-foreground focus-visible:ring-success/50",
        },
        {
          tone: "warning",
          appearance: "frosted",
          className: "border-warning/40 text-foreground focus-visible:ring-warning/50",
        },
        {
          tone: "error",
          appearance: "frosted",
          className: "border-error/40 text-foreground focus-visible:ring-error/50",
        },
      ],
      defaultVariants: { variant: "default", size: "md", eyebrow: false, isLink: false },
    },
  },
  components: [
    {
      exportName: "Badge",
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "omitHtmlAttributes", element: "a", keys: ["type"] },
          { type: "variantProps", variant: "badge", omit: ["isLink"] },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement | HTMLAnchorElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "tone" },
          { name: "appearance" },
          { name: "eyebrow" },
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "usesComposedBadgeStyle",
          value: { type: "raw", code: "tone !== undefined || appearance !== undefined" },
        },
        {
          name: "resolvedVariant",
          value: {
            type: "raw",
            code: "(usesComposedBadgeStyle ? null : variant) as typeof variant",
          },
        },
        {
          name: "resolvedTone",
          value: { type: "raw", code: 'usesComposedBadgeStyle ? (tone ?? "neutral") : undefined' },
        },
        {
          name: "resolvedAppearance",
          value: {
            type: "raw",
            code: 'usesComposedBadgeStyle ? (appearance ?? "soft") : undefined',
          },
        },
        { name: "Tag", value: { type: "raw", code: 'rest.href ? "a" : "div"' } },
      ],
      render: [
        {
          type: "element",
          tag: "Tag",
          attrs: [
            { name: "data-sw-badge" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "badge",
                args: {
                  variant: "resolvedVariant",
                  tone: "resolvedTone",
                  appearance: "resolvedAppearance",
                  eyebrow: "eyebrow",
                  size: "size",
                  isLink: "Boolean(rest.href)",
                  class: "className",
                },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "ref",
              value: {
                type: "raw",
                code: "ref as React.Ref<HTMLDivElement> & React.Ref<HTMLAnchorElement>",
              },
              frameworks: ["react"],
            },
            { name: "data-slot", value: { type: "literal", value: "badge" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
