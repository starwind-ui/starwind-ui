import type { StyledAdapterContract } from "../types.js";

export const sliderStyledContract: StyledAdapterContract = {
  component: "slider",
  publicExports: ["Slider"],
  defaultExport: { Root: "Slider" },
  defaultExportMode: "component",
  variantCollectionName: "SliderVariants",
  variants: {
    slider: {
      base: "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
    },
    sliderControl: {
      base: "relative w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
    },
    sliderTrack: {
      base: "bg-muted relative overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
    },
    sliderRange: {
      base: "absolute data-error-visible:bg-error data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
      variants: {
        variant: {
          default: "bg-foreground",
          primary: "bg-primary",
          secondary: "bg-secondary",
          info: "bg-info",
          success: "bg-success",
          warning: "bg-warning",
          error: "bg-error",
        },
      },
      defaultVariants: { variant: "default" },
    },
    sliderThumb: {
      base: [
        "absolute block size-4 shrink-0 rounded-full border bg-white shadow-sm",
        "transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden",
        "data-error-visible:border-error data-error-visible:ring-error/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[orientation=horizontal]:top-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=horizontal]:-translate-y-1/2",
        "data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:translate-y-1/2",
      ],
      variants: {
        variant: {
          default: "border-foreground ring-outline/50",
          primary: "border-primary ring-primary/50",
          secondary: "border-secondary ring-secondary/50",
          info: "border-info ring-info/50",
          success: "border-success ring-success/50",
          warning: "border-warning ring-warning/50",
          error: "border-error ring-error/50",
        },
      },
      defaultVariants: { variant: "default" },
    },
  },
  components: [
    {
      exportName: "Slider",
      primitiveAliases: { slider: "SliderPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "div",
            keys: ["defaultValue", "onChange", "value"],
          },
          { type: "variantProps", variant: "sliderRange" },
          { type: "variantProps", variant: "sliderThumb" },
        ],
        fields: [
          {
            name: "defaultValue",
            optional: true,
            type: "number | number[]",
            frameworks: ["astro"],
          },
          {
            name: "defaultValue",
            optional: true,
            type: 'import("@starwind-ui/runtime").SliderValue',
            frameworks: ["react"],
          },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "form", optional: true, type: "string" },
          { name: "largeStep", optional: true, type: "number" },
          { name: "max", optional: true, type: "number" },
          { name: "min", optional: true, type: "number" },
          { name: "name", optional: true, type: "string" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime").SliderValue, details: import("@starwind-ui/runtime").SliderValueChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onValueCommitted",
            optional: true,
            type: '(value: import("@starwind-ui/runtime").SliderValue, details: import("@starwind-ui/runtime").SliderValueCommitDetails) => void',
            frameworks: ["react"],
          },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "step", optional: true, type: "number" },
          {
            name: "value",
            optional: true,
            type: "number | number[]",
            frameworks: ["astro"],
          },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").SliderValue',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "variant", defaultValue: '"default"' },
          { name: "defaultValue", defaultValue: "0" },
          { name: "disabled", defaultValue: "false" },
          { name: "form" },
          { name: "largeStep", defaultValue: "10" },
          { name: "max", defaultValue: "100" },
          { name: "min", defaultValue: "0" },
          { name: "name" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "onValueCommitted", frameworks: ["react"] },
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "ref", frameworks: ["react"] },
          { name: "step", defaultValue: "1" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "resolvedValue",
          value: { type: "raw", code: "value ?? defaultValue" },
        },
        {
          name: "values",
          value: {
            type: "raw",
            code: "Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]",
          },
        },
        {
          name: "getPercentage",
          value: {
            type: "raw",
            code: "(item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100)",
          },
        },
        {
          name: "rangeStart",
          value: {
            type: "raw",
            code: "values.length > 1 ? getPercentage(Math.min(...values)) : 0",
          },
        },
        {
          name: "rangeEnd",
          value: {
            type: "raw",
            code: "values.length > 1 ? getPercentage(Math.max(...values)) : getPercentage(values[0] ?? min)",
          },
        },
        {
          name: "rangeStyle",
          value: {
            type: "raw",
            code: 'orientation === "horizontal" ? { left: `${rangeStart}%`, width: `${rangeEnd - rangeStart}%` } : { bottom: `${rangeStart}%`, height: `${rangeEnd - rangeStart}%` }',
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "slider",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "slider",
                args: { class: "className" },
              },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "form", value: { type: "variable", name: "form" } },
            { name: "largeStep", value: { type: "variable", name: "largeStep" } },
            { name: "max", value: { type: "variable", name: "max" } },
            { name: "min", value: { type: "variable", name: "min" } },
            { name: "name", value: { type: "variable", name: "name" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            {
              name: "onValueCommitted",
              value: { type: "variable", name: "onValueCommitted" },
              frameworks: ["react"],
            },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "step", value: { type: "variable", name: "step" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "slider" } },
          ],
          children: [
            {
              type: "primitive",
              component: "slider",
              part: "Control",
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "sliderControl" },
                },
                { name: "data-orientation", value: { type: "variable", name: "orientation" } },
                { name: "data-slot", value: { type: "literal", value: "slider-control" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "slider",
                  part: "Track",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "sliderTrack" },
                    },
                    { name: "data-orientation", value: { type: "variable", name: "orientation" } },
                    { name: "data-slot", value: { type: "literal", value: "slider-track" } },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "slider",
                      part: "Indicator",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: {
                            type: "classVariant",
                            variant: "sliderRange",
                            args: { variant: "variant" },
                          },
                        },
                        {
                          name: "data-orientation",
                          value: { type: "variable", name: "orientation" },
                        },
                        { name: "data-slot", value: { type: "literal", value: "slider-range" } },
                        { name: "style", value: { type: "variable", name: "rangeStyle" } },
                      ],
                    },
                  ],
                },
                {
                  type: "repeat",
                  each: "values",
                  item: "_",
                  index: "index",
                  children: [
                    {
                      type: "primitive",
                      component: "slider",
                      part: "Thumb",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: {
                            type: "classVariant",
                            variant: "sliderThumb",
                            args: { variant: "variant" },
                          },
                        },
                        {
                          name: "key",
                          value: { type: "variable", name: "index" },
                          frameworks: ["react"],
                        },
                        { name: "index", value: { type: "variable", name: "index" } },
                        {
                          name: "style",
                          value: {
                            type: "raw",
                            code: 'orientation === "horizontal" ? { left: `${getPercentage(values[index] ?? min)}%` } : { bottom: `${getPercentage(values[index] ?? min)}%` }',
                          },
                        },
                        {
                          name: "data-orientation",
                          value: { type: "variable", name: "orientation" },
                        },
                        { name: "data-slot", value: { type: "literal", value: "slider-thumb" } },
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
