import type { StyledAdapterContract } from "../types.js";

export const spinnerStyledContract: StyledAdapterContract = {
  component: "spinner",
  publicExports: ["Spinner"],
  defaultExport: { Root: "Spinner" },
  defaultExportMode: "component",
  variantCollectionName: "SpinnerVariants",
  variants: {
    spinner: {
      base: "size-4 animate-spin",
    },
  },
  components: [
    {
      exportName: "Spinner",
      imports: [
        { importName: "Loader2", source: "@tabler/icons/outline/loader-2.svg", type: "default" },
      ],
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "svg", keys: ["role", "aria-label"] }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "icon",
          importName: "Loader2",
          attrs: [
            { name: "role", value: { type: "literal", value: "status" } },
            { name: "aria-label", value: { type: "literal", value: "Loading" } },
            {
              name: "class",
              value: { type: "classVariant", variant: "spinner", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "spinner" } },
          ],
        },
      ],
    },
  ],
};
