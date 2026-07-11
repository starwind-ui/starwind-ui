import type { StyledAdapterContract } from "../types.js";

export const textareaStyledContract: StyledAdapterContract = {
  component: "textarea",
  publicExports: ["Textarea"],
  defaultExport: { Root: "Textarea" },
  defaultExportMode: "component",
  variantCollectionName: "TextareaVariants",
  variants: {
    textarea: {
      base: [
        "border-input dark:bg-input/30 text-foreground ring-offset-background min-h-10 w-full rounded-md border bg-transparent shadow-xs",
        "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] focus-visible:ring-3 focus-visible:transition-none",
        "file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
        "peer placeholder:text-muted-foreground",
      ],
      variants: {
        size: {
          sm: "min-h-9 px-2 py-1 text-sm",
          md: "min-h-10 px-3 py-2 text-base",
          lg: "min-h-12 px-4 py-3 text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "Textarea",
      props: {
        declaration: "interface",
        extends: [
          { type: "omitHtmlAttributes", element: "textarea", keys: ["children"] },
          { type: "variantProps", variant: "textarea" },
        ],
        fields: [
          {
            name: "data-slot",
            optional: true,
            type: "string",
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLTextAreaElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "data-slot", alias: "dataSlot", defaultValue: '"textarea"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "textarea",
          selfClosing: true,
          attrs: [
            { name: "data-sw-textarea" },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "textarea",
                args: { size: "size", class: "className" },
              },
            },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          ],
        },
      ],
    },
  ],
};
