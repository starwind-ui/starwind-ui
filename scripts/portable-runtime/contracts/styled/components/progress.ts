import type { StyledAdapterContract } from "../types.js";

export const progressStyledContract: StyledAdapterContract = {
  component: "progress",
  publicExports: ["Progress"],
  defaultExport: { Root: "Progress" },
  defaultExportMode: "component",
  variantCollectionName: "ProgressVariants",
  variants: {
    progress: {
      base: "bg-muted h-2 w-full overflow-hidden rounded-full",
      variants: {
        variant: {
          indeterminate: "relative",
        },
      },
    },
    progressTrack: {
      base: "h-full w-full",
    },
    progressIndicator: {
      base: [
        "h-full w-full flex-1 transition-transform",
        "data-instant:transition-none motion-reduce:transition-none",
      ],
      variants: {
        variant: {
          indeterminate: "absolute inset-y-0 start-0 w-3/4",
        },
        color: {
          primary: "bg-primary",
          secondary: "bg-secondary",
          default: "bg-foreground",
          info: "bg-info",
          success: "bg-success",
          warning: "bg-warning",
          error: "bg-error",
        },
      },
      defaultVariants: {
        color: "primary",
      },
    },
  },
  components: [
    {
      exportName: "Progress",
      primitiveAliases: { progress: "ProgressPrimitive" },
      props: {
        declaration: "interface",
        extends: [{ type: "omitHtmlAttributes", element: "div", keys: ["value"] }],
        fields: [
          { name: "label", optional: true, type: "string" },
          { name: "max", optional: true, type: "number" },
          { name: "min", optional: true, type: "number" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "value", optional: true, type: "number | null" },
          {
            name: "variant",
            optional: true,
            type: '"default" | "primary" | "secondary" | "info" | "success" | "warning" | "error"',
          },
        ],
      },
      destructure: {
        props: [
          { name: "label" },
          { name: "value", defaultValue: "null" },
          { name: "max", defaultValue: "100" },
          { name: "min", defaultValue: "0" },
          { name: "variant", defaultValue: '"default"' },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "ariaLabel",
          value: { type: "raw", code: 'rest["aria-label"] ?? label' },
        },
        {
          name: "boundedMin",
          value: { type: "raw", code: "Number.isFinite(min) ? min : 0" },
        },
        {
          name: "boundedMax",
          value: { type: "raw", code: "Number.isFinite(max) ? max : 100" },
        },
        {
          name: "normalizedMin",
          value: { type: "raw", code: "Math.min(boundedMin, boundedMax)" },
        },
        {
          name: "normalizedMax",
          value: { type: "raw", code: "Math.max(boundedMin, boundedMax)" },
        },
        {
          name: "progressValue",
          value: {
            type: "raw",
            code: "value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), normalizedMin), normalizedMax)",
          },
        },
        {
          name: "isIndeterminate",
          value: { type: "raw", code: "progressValue === null" },
        },
        {
          name: "progressPercent",
          value: {
            type: "raw",
            code: "isIndeterminate ? 0 : normalizedMax === normalizedMin ? progressValue >= normalizedMax ? 100 : 0 : Math.round(Math.min(Math.max(((progressValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100, 0), 100))",
          },
        },
        {
          name: "indicatorStyle",
          value: {
            type: "raw",
            code: "isIndeterminate ? undefined : { transform: `translateX(-${100 - progressPercent}%)` }",
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "progress",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "progress",
                args: {
                  variant: 'isIndeterminate ? "indeterminate" : undefined',
                  class: "className",
                },
              },
            },
            { name: "max", value: { type: "variable", name: "normalizedMax" } },
            { name: "min", value: { type: "variable", name: "normalizedMin" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "value", value: { type: "variable", name: "progressValue" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "aria-label", value: { type: "variable", name: "ariaLabel" } },
            { name: "data-slot", value: { type: "literal", value: "progress" } },
          ],
          children: [
            {
              type: "primitive",
              component: "progress",
              part: "Track",
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "progressTrack" },
                },
                { name: "data-slot", value: { type: "literal", value: "progress-track" } },
              ],
              children: [
                {
                  type: "primitive",
                  component: "progress",
                  part: "Indicator",
                  selfClosing: true,
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "progressIndicator",
                        args: {
                          variant: 'isIndeterminate ? "indeterminate" : undefined',
                          color: "variant",
                        },
                      },
                    },
                    { name: "style", value: { type: "variable", name: "indicatorStyle" } },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "progress-indicator" },
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
