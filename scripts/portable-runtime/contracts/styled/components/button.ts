import type { StyledAdapterContract } from "../types.js";

export const buttonStyledContract: StyledAdapterContract = {
  component: "button",
  publicExports: ["Button"],
  defaultExport: { Root: "Button" },
  variantCollectionName: "ButtonVariants",
  variants: {
    button: {
      base: [
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "transition-all outline-none focus-visible:ring-3",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
      ],
      variants: {
        variant: {
          default:
            "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50",
          primary:
            "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50",
          secondary:
            "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] focus-visible:ring-secondary/50",
          outline:
            "dark:border-input focus-visible:ring-outline/50 bg-background dark:bg-input/30 focus-visible:border-outline hover:bg-muted dark:hover:bg-input/50 hover:text-foreground border shadow-xs",
          ghost: "hover:bg-muted hover:text-foreground focus-visible:ring-outline/50",
          info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/50",
          success:
            "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/50",
          warning:
            "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/50",
          error: "bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error/50",
        },
        size: {
          sm: "h-9 px-4 text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3.5",
          md: "h-11 px-5 text-base has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-4.5",
          lg: "h-12 px-8 text-lg has-[>svg]:px-6 [&_svg:not([class*='size-'])]:size-5",
          "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
          icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5",
          "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
        },
      },
      defaultVariants: { variant: "default", size: "md" },
    },
  },
  components: [
    {
      exportName: "Button",
      primitiveAliases: { button: "Button" },
      props: {
        declaration: "interface",
        extends: [
          { type: "htmlAttributes", element: "button" },
          { type: "omitHtmlAttributes", element: "a", keys: ["type"] },
          { type: "variantProps", variant: "button" },
        ],
        fields: [
          {
            name: "as",
            optional: true,
            type: '"button" | "a"',
          },
          {
            name: "data-slot",
            optional: true,
            type: "string",
          },
          { name: "focusableWhenDisabled", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLButtonElement | HTMLAnchorElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "size" },
          { name: "as", alias: "buttonAs" },
          { name: "href" },
          { name: "disabled", defaultValue: "false" },
          { name: "focusableWhenDisabled" },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"button"' },
          { name: "ref", frameworks: ["react"] },
          { name: "tabindex", frameworks: ["astro", "vue"] },
          { name: "tabIndex", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "conditional",
          condition: 'buttonAs === "a" || href !== undefined',
          then: [
            {
              type: "element",
              tag: "a",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "button",
                    args: { variant: "variant", size: "size", class: "className" },
                  },
                },
                { name: "href", value: { type: "raw", code: "disabled ? undefined : href" } },
                {
                  name: "aria-disabled",
                  value: { type: "raw", code: 'disabled ? "true" : undefined' },
                },
                {
                  name: "data-disabled",
                  value: { type: "raw", code: 'disabled ? "" : undefined' },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "tabindex",
                  value: { type: "raw", code: "disabled ? -1 : tabindex" },
                  frameworks: ["astro", "vue"],
                },
                {
                  name: "tabIndex",
                  value: { type: "raw", code: "disabled ? -1 : tabIndex" },
                  frameworks: ["react"],
                },
                {
                  name: "ref",
                  value: { type: "raw", code: "ref as React.Ref<HTMLAnchorElement>" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "button",
              part: "Root",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "button",
                    args: { variant: "variant", size: "size", class: "className" },
                  },
                },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                {
                  name: "focusableWhenDisabled",
                  value: { type: "variable", name: "focusableWhenDisabled" },
                },
                {
                  name: "ref",
                  value: { type: "raw", code: "ref as React.Ref<HTMLButtonElement>" },
                  frameworks: ["react"],
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
  ],
};
