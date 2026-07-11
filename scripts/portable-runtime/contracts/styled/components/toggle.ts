import type { StyledAdapterContract } from "../types.js";

export const toggleStyledContract: StyledAdapterContract = {
  component: "toggle",
  publicExports: ["Toggle"],
  defaultExport: { Root: "Toggle" },
  defaultExportMode: "component",
  variantCollectionName: "ToggleVariants",
  variants: {
    toggle: {
      base: [
        "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:bg-muted data-[state=on]:text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:ring-3",
        "transition-colors outline-none",
        "aria-invalid:ring-error/40 aria-invalid:border-error",
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
        variant: "default",
        size: "md",
      },
    },
  },
  components: [
    {
      exportName: "Toggle",
      primitiveAliases: { toggle: "TogglePrimitive" },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "button",
            keys: ["aria-pressed", "defaultPressed", "disabled", "onChange", "type", "value"],
          },
          { type: "variantProps", variant: "toggle" },
        ],
        fields: [
          { name: "defaultPressed", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "nativeButton", optional: true, type: "boolean" },
          { name: "data-slot", optional: true, type: "string" },
          {
            name: "onPressedChange",
            optional: true,
            type: '(pressed: boolean, details: import("@starwind-ui/runtime").TogglePressedChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "pressed", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLButtonElement | HTMLSpanElement>",
            frameworks: ["react"],
          },
          { name: "syncGroup", optional: true, type: "string" },
          { name: "value", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "variant" },
          { name: "size" },
          { name: "defaultPressed" },
          { name: "disabled", defaultValue: "false" },
          { name: "nativeButton" },
          { name: "onPressedChange", frameworks: ["react"] },
          { name: "pressed" },
          { name: "ref", frameworks: ["react"] },
          { name: "syncGroup" },
          { name: "value" },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"toggle"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "toggle",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toggle",
                args: { variant: "variant", size: "size", class: "className" },
              },
            },
            { name: "defaultPressed", value: { type: "variable", name: "defaultPressed" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "nativeButton", value: { type: "variable", name: "nativeButton" } },
            {
              name: "onPressedChange",
              value: { type: "variable", name: "onPressedChange" },
              frameworks: ["react"],
            },
            { name: "pressed", value: { type: "variable", name: "pressed" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "syncGroup", value: { type: "variable", name: "syncGroup" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
