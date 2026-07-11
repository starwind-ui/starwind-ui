import type { StyledAdapterContract } from "../types.js";

export const themeToggleStyledContract: StyledAdapterContract = {
  component: "theme-toggle",
  publicExports: ["ThemeToggle"],
  defaultExport: { Root: "ThemeToggle" },
  defaultExportMode: "component",
  variantCollectionName: "ThemeToggleVariants",
  variants: {
    themeToggle: {
      base: [
        "group inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
        "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-[state=on]:bg-muted data-[state=on]:text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:ring-3",
        "transition-colors outline-none",
        "aria-invalid:ring-error/40 aria-invalid:border-error",
        "hover:border-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent",
      ],
      variants: {
        variant: {
          default: "hover:bg-muted hover:text-foreground bg-transparent",
          outline:
            "border-input hover:bg-muted hover:text-foreground border bg-transparent shadow-xs",
        },
        size: {
          sm: "h-9 min-w-9 px-2 text-sm",
          md: "h-11 min-w-11 px-2.5 text-base",
          lg: "h-12 min-w-12 px-3 text-lg",
        },
      },
      defaultVariants: {
        variant: "outline",
        size: "md",
      },
    },
  },
  components: [
    {
      exportName: "ThemeToggle",
      imports: [
        {
          type: "named",
          importName: "initThemeController",
          source: "@starwind-ui/runtime/theme",
          frameworks: ["react"],
        },
        { type: "default", importName: "Moon", source: "@tabler/icons/outline/moon.svg" },
        { type: "default", importName: "Sun", source: "@tabler/icons/outline/sun.svg" },
      ],
      client: {
        astroScript: [
          '  import { initThemeController } from "@starwind-ui/runtime/theme";',
          "",
          "  const setupThemeController = () => {",
          "    initThemeController();",
          "  };",
          "",
          "  setupThemeController();",
          '  document.addEventListener("astro:after-swap", setupThemeController);',
          '  document.addEventListener("starwind:init", setupThemeController);',
        ],
        reactEffect: ["initThemeController();"],
      },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "button",
            keys: ["aria-pressed", "defaultPressed", "disabled", "onChange", "type", "value"],
          },
          { type: "variantProps", variant: "themeToggle" },
        ],
        fields: [
          { name: "ariaLabel", optional: true, type: "string" },
          { name: "defaultPressed", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "data-slot", optional: true, type: "string" },
          { name: "pressed", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLButtonElement>",
            frameworks: ["react"],
          },
          { name: "syncGroup", optional: true, type: "string" },
          { name: "value", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "ariaLabel", defaultValue: '"Toggle theme"' },
          { name: "variant", defaultValue: '"outline"' },
          { name: "size", defaultValue: '"md"' },
          { name: "defaultPressed" },
          { name: "disabled", defaultValue: "false" },
          { name: "pressed" },
          { name: "ref", frameworks: ["react"] },
          { name: "syncGroup", defaultValue: '"starwind-theme"' },
          { name: "value" },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"theme-toggle"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "initialPressed",
          value: { type: "raw", code: "pressed ?? defaultPressed ?? false" },
        },
      ],
      render: [
        {
          type: "element",
          tag: "button",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "themeToggle",
                args: { variant: "variant", size: "size", class: "className" },
              },
            },
            { name: "type", value: { type: "literal", value: "button" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "aria-label", value: { type: "variable", name: "ariaLabel" } },
            {
              name: "aria-pressed",
              value: { type: "raw", code: 'initialPressed ? "true" : "false"' },
            },
            {
              name: "data-state",
              value: { type: "raw", code: 'initialPressed ? "on" : "off"' },
            },
            { name: "data-sw-toggle" },
            { name: "data-sw-theme-toggle" },
            { name: "data-sw-theme-control" },
            { name: "data-theme-on", value: { type: "literal", value: "dark" } },
            { name: "data-theme-off", value: { type: "literal", value: "light" } },
            { name: "data-sync-group", value: { type: "variable", name: "syncGroup" } },
            { name: "data-value", value: { type: "variable", name: "value" } },
            {
              name: "data-pressed",
              value: { type: "raw", code: 'initialPressed ? "" : undefined' },
            },
            {
              name: "data-unpressed",
              value: { type: "raw", code: 'initialPressed ? undefined : ""' },
            },
            { name: "data-disabled", value: { type: "raw", code: 'disabled ? "" : undefined' } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [
                    { name: "class", value: { type: "literal", value: "size-5" } },
                    { name: "data-theme-icon-wrapper" },
                  ],
                  children: [
                    {
                      type: "slot",
                      name: "light-icon",
                      fallback: [
                        {
                          type: "icon",
                          importName: "Sun",
                          attrs: [
                            {
                              name: "class",
                              value: {
                                type: "literal",
                                value: "hidden size-5 group-data-[state=off]:data-ready:block",
                              },
                            },
                            { name: "aria-hidden", value: { type: "literal", value: "true" } },
                            { name: "data-theme-icon" },
                          ],
                        },
                      ],
                    },
                    {
                      type: "slot",
                      name: "dark-icon",
                      fallback: [
                        {
                          type: "icon",
                          importName: "Moon",
                          attrs: [
                            {
                              name: "class",
                              value: {
                                type: "literal",
                                value: "hidden size-5 group-data-[state=on]:data-ready:block",
                              },
                            },
                            { name: "aria-hidden", value: { type: "literal", value: "true" } },
                            { name: "data-theme-icon" },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
