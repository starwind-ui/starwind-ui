import type { StyledAdapterContract } from "../types.js";

export const toggleGroupStyledContract: StyledAdapterContract = {
  component: "toggle-group",
  publicExports: ["ToggleGroup", "ToggleGroupItem"],
  defaultExport: { Root: "ToggleGroup", Item: "ToggleGroupItem" },
  variantCollectionName: "ToggleGroupVariants",
  variants: {
    toggleGroup: {
      base: [
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg",
        "data-[size=sm]:rounded-[min(var(--radius-md),10px)]",
        "data-vertical:flex-col data-vertical:items-stretch",
      ],
    },
    toggleGroupItem: {
      base: [
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:bg-muted data-[state=on]:text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "focus:z-10 focus-visible:z-10 focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:ring-3",
        "transition-colors outline-none",
        "aria-invalid:ring-error/40 aria-invalid:border-error",
        "group-data-[variant=default]/toggle-group:hover:bg-muted group-data-[variant=default]/toggle-group:hover:text-foreground group-data-[variant=default]/toggle-group:bg-transparent",
        "group-data-[variant=outline]/toggle-group:border-input group-data-[variant=outline]/toggle-group:hover:bg-muted group-data-[variant=outline]/toggle-group:hover:text-foreground group-data-[variant=outline]/toggle-group:border group-data-[variant=outline]/toggle-group:bg-transparent group-data-[variant=outline]/toggle-group:shadow-xs",
        "group-data-[size=sm]/toggle-group:h-9 group-data-[size=sm]/toggle-group:min-w-9 group-data-[size=sm]/toggle-group:px-2 group-data-[size=sm]/toggle-group:text-sm",
        "group-data-[size=md]/toggle-group:h-11 group-data-[size=md]/toggle-group:min-w-11 group-data-[size=md]/toggle-group:px-2.5 group-data-[size=md]/toggle-group:text-base",
        "group-data-[size=lg]/toggle-group:h-12 group-data-[size=lg]/toggle-group:min-w-12 group-data-[size=lg]/toggle-group:px-3 group-data-[size=lg]/toggle-group:text-lg",
        "group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2",
        "group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5",
        "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-l-lg group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-t-lg",
        "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-r-lg group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-b-lg",
        "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:border-l-0 group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:border-t-0",
        "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:first:border-l group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:first:border-t",
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
    },
  },
  components: [
    {
      exportName: "ToggleGroup",
      primitiveAliases: { "toggle-group": "ToggleGroupPrimitive" },
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "div", keys: ["defaultValue", "onChange"] },
        ],
        fields: [
          { name: "defaultValue", optional: true, type: "string[]" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "loopFocus", optional: true, type: "boolean" },
          { name: "multiple", optional: true, type: "boolean" },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime").ToggleGroupValue, details: import("@starwind-ui/runtime").ToggleGroupValueChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "size", optional: true, type: '"sm" | "md" | "lg"' },
          { name: "spacing", optional: true, type: "number" },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").ToggleGroupValue',
            frameworks: ["react"],
          },
          { name: "variant", optional: true, type: '"default" | "outline"' },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"default"' },
          { name: "size", defaultValue: '"md"' },
          { name: "spacing", defaultValue: "2" },
          { name: "defaultValue" },
          { name: "disabled", defaultValue: "false" },
          { name: "loopFocus" },
          { name: "multiple", defaultValue: "false" },
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "value", frameworks: ["react"] },
          { name: "style" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "toggleGroupStyle",
          value: {
            type: "raw",
            code: 'typeof style === "string" ? `--gap: ${spacing}; ${style}` : { "--gap": spacing, ...(style ?? {}) }',
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "toggle-group",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toggleGroup",
                args: { class: "className" },
              },
            },
            { name: "data-variant", value: { type: "variable", name: "variant" } },
            { name: "data-size", value: { type: "variable", name: "size" } },
            { name: "data-spacing", value: { type: "variable", name: "spacing" } },
            {
              name: "data-horizontal",
              value: { type: "raw", code: 'orientation === "horizontal" ? "" : undefined' },
            },
            {
              name: "data-vertical",
              value: { type: "raw", code: 'orientation === "vertical" ? "" : undefined' },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "loopFocus", value: { type: "variable", name: "loopFocus" } },
            { name: "multiple", value: { type: "variable", name: "multiple" } },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            {
              name: "style",
              value: { type: "variable", name: "toggleGroupStyle" },
              frameworks: ["astro"],
            },
            {
              name: "style",
              value: { type: "raw", code: "toggleGroupStyle as React.CSSProperties" },
              frameworks: ["react"],
            },
            { name: "value", value: { type: "variable", name: "value" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toggle-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ToggleGroupItem",
      primitiveAliases: { toggle: "TogglePrimitive" },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "button",
            keys: ["aria-pressed", "defaultPressed", "disabled", "onChange", "type", "value"],
          },
        ],
        fields: [
          { name: "defaultPressed", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "nativeButton", optional: true, type: "boolean" },
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
          { name: "size", optional: true, type: '"sm" | "md" | "lg"' },
          { name: "value", optional: true, type: "string" },
          { name: "variant", optional: true, type: '"default" | "outline"' },
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
          { name: "value" },
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
                variant: "toggleGroupItem",
                args: { variant: "variant", size: "size", class: "className" },
              },
            },
            { name: "data-variant", value: { type: "variable", name: "variant" } },
            { name: "data-size", value: { type: "variable", name: "size" } },
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
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toggle-group-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
