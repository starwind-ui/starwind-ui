import type { StyledAdapterContract, StyledComponentContract } from "../types.js";

type NativeSelectNativePartOptions = {
  exportName: string;
  htmlElement: string;
  refElement: string;
  slot: string;
};

const nativeSelectNativePartClassName = "bg-[Canvas] text-[CanvasText]";

const chevronDownImport = {
  importName: "ChevronDown",
  source: "@tabler/icons/outline/chevron-down.svg",
  type: "default",
} as const;

function nativeSelectNativePart({
  exportName,
  htmlElement,
  refElement,
  slot,
}: NativeSelectNativePartOptions): StyledComponentContract {
  return {
    exportName,
    props: {
      extends: [{ type: "htmlAttributes", element: htmlElement }],
      fields: [
        {
          name: "ref",
          optional: true,
          type: `React.Ref<${refElement}>`,
          frameworks: ["react"],
        },
      ],
    },
    destructure: {
      props: [
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "element",
        tag: htmlElement,
        attrs: [
          {
            name: "class",
            value: {
              type: "classJoin",
              items: [
                { type: "literal", value: nativeSelectNativePartClassName },
                { type: "variable", name: "className" },
              ],
            },
          },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: slot } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

export const nativeSelectStyledContract: StyledAdapterContract = {
  component: "native-select",
  publicExports: ["NativeSelect", "NativeSelectOptGroup", "NativeSelectOption"],
  defaultExport: {
    Root: "NativeSelect",
    Option: "NativeSelectOption",
    OptGroup: "NativeSelectOptGroup",
  },
  variantCollectionName: "NativeSelectVariants",
  variants: {
    nativeSelectWrapper: {
      base: ["group/native-select relative w-fit has-[select:disabled]:opacity-50"],
    },
    nativeSelect: {
      base: [
        "border-input dark:bg-input/30 text-foreground ring-offset-background w-full rounded-md border bg-transparent shadow-xs",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground appearance-none bg-none select-none",
        "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3 focus-visible:transition-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
      ],
      variants: {
        size: {
          sm: "h-9 pr-8 pl-2 text-sm",
          md: "h-11 pr-9 pl-3 text-base",
          lg: "h-12 pr-10 pl-4 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    },
    nativeSelectIcon: {
      base: ["text-foreground pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-50"],
      variants: {
        size: {
          sm: "right-2 size-3.5",
          md: "right-3 size-4",
          lg: "right-4 size-5",
        },
      },
      defaultVariants: {
        size: "md",
      },
    },
  },
  components: [
    {
      exportName: "NativeSelect",
      imports: [chevronDownImport],
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "select", keys: ["size"] },
          { type: "variantProps", variant: "nativeSelect" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLSelectElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "size" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "nativeSelectWrapper" },
            },
            { name: "data-size", value: { type: "variable", name: "size" } },
            { name: "data-slot", value: { type: "literal", value: "native-select-wrapper" } },
          ],
          children: [
            {
              type: "element",
              tag: "select",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "nativeSelect",
                    args: { size: "size", class: "className" },
                  },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
                { name: "data-slot", value: { type: "literal", value: "native-select" } },
              ],
              children: [{ type: "slot" }],
            },
            {
              type: "slot",
              name: "icon",
              fallback: [
                {
                  type: "icon",
                  importName: "ChevronDown",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "nativeSelectIcon",
                        args: { size: "size" },
                      },
                    },
                    { name: "aria-hidden", value: { type: "literal", value: "true" } },
                    { name: "data-slot", value: { type: "literal", value: "native-select-icon" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    nativeSelectNativePart({
      exportName: "NativeSelectOption",
      htmlElement: "option",
      refElement: "HTMLOptionElement",
      slot: "native-select-option",
    }),
    nativeSelectNativePart({
      exportName: "NativeSelectOptGroup",
      htmlElement: "optgroup",
      refElement: "HTMLOptGroupElement",
      slot: "native-select-optgroup",
    }),
  ],
};
