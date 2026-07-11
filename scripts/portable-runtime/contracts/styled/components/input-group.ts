import type { StyledAdapterContract } from "../types.js";

export const inputGroupStyledContract: StyledAdapterContract = {
  component: "input-group",
  publicExports: [
    "InputGroup",
    "InputGroupAddon",
    "InputGroupButton",
    "InputGroupInput",
    "InputGroupText",
    "InputGroupTextarea",
  ],
  defaultExport: {
    Root: "InputGroup",
    Addon: "InputGroupAddon",
    Button: "InputGroupButton",
    Input: "InputGroupInput",
    Text: "InputGroupText",
    Textarea: "InputGroupTextarea",
  },
  variantCollectionName: "InputGroupVariants",
  variants: {
    inputGroup: {
      base: [
        "border-input dark:bg-input/30 group/input-group relative flex h-11 w-full min-w-0 items-center rounded-lg border transition-[color,box-shadow] outline-none focus-within:transition-none",
        "has-[[data-slot=input-group-control]:focus-visible]:border-outline has-[[data-slot=input-group-control]:focus-visible]:ring-outline/50 has-[[data-slot=input-group-control]:focus-visible]:ring-3",
        "has-[[data-slot][data-error-visible]]:border-error has-[[data-slot][data-error-visible]]:ring-error/40 has-[[data-slot][data-error-visible]]:ring-3",
        "has-disabled:bg-input/50 has-disabled:opacity-50",
        "has-[>textarea]:h-auto",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col",
        "has-[>[data-align=block-end]]:[&>[data-slot=input-group-control]]:pt-3",
        "has-[>[data-align=block-start]]:[&>[data-slot=input-group-control]]:pb-3",
        "has-[>[data-align=inline-end]]:[&>[data-slot=input-group-control]]:pr-1.5",
        "has-[>[data-align=inline-start]]:[&>[data-slot=input-group-control]]:pl-1.5",
      ],
    },
    inputGroupAddon: {
      base: [
        "text-muted-foreground flex cursor-text items-center justify-center gap-2 text-sm font-medium select-none",
        "group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-xs [&>svg:not([class*='size-'])]:size-4",
      ],
      variants: {
        align: {
          "inline-start": "order-first pl-2.5 has-[>button]:ml-[-0.3rem]",
          "inline-end": "order-last pr-2.5 has-[>button]:mr-[-0.3rem]",
          "block-start":
            "order-first w-full justify-start px-3 pt-2 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-2.5",
          "block-end":
            "order-last w-full justify-start px-3 pb-2 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-2.5",
        },
      },
      defaultVariants: {
        align: "inline-start",
      },
    },
    inputGroupButton: {
      base: "gap-2 rounded-sm shadow-none",
      variants: {
        size: {
          sm: "h-8 px-2",
          "icon-sm": "size-8 p-0 has-[>svg]:p-0",
        },
      },
      defaultVariants: {
        size: "sm",
      },
    },
    inputGroupInput: {
      base: "h-full flex-1 rounded-none border-0 shadow-none ring-0 outline-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
    },
    inputGroupText: {
      base: [
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4.5",
      ],
    },
    inputGroupTextarea: {
      base: "h-full flex-1 resize-none rounded-none border-0 shadow-none ring-0 outline-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
    },
  },
  components: [
    {
      exportName: "InputGroup",
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "role", value: { type: "literal", value: "group" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroup",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputGroupAddon",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "inputGroupAddon" },
        ],
      },
      destructure: {
        props: [{ name: "align" }, { name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "role", value: { type: "literal", value: "group" } },
            { name: "data-align", value: { type: "variable", name: "align" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroupAddon",
                args: { align: "align", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-group-addon" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputGroupButton",
      props: {
        extends: [
          { type: "componentProps", component: "button", exportName: "Button", keys: ["size"] },
          { type: "variantProps", variant: "inputGroupButton" },
        ],
      },
      destructure: {
        props: [
          { name: "type", defaultValue: '"button"' },
          { name: "variant", defaultValue: '"ghost"' },
          { name: "size" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "button",
          exportName: "Button",
          attrs: [
            { name: "type", value: { type: "variable", name: "type" } },
            { name: "data-size", value: { type: "variable", name: "size" } },
            { name: "size", value: { type: "variable", name: "size" } },
            { name: "variant", value: { type: "variable", name: "variant" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroupButton",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputGroupInput",
      props: { extends: [{ type: "componentProps", component: "input", exportName: "Input" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "input",
          exportName: "Input",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroupInput",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-group-control" } },
          ],
        },
      ],
    },
    {
      exportName: "InputGroupText",
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "span",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroupText",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "InputGroupTextarea",
      props: {
        extends: [{ type: "componentProps", component: "textarea", exportName: "Textarea" }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "textarea",
          exportName: "Textarea",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "inputGroupTextarea",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "input-group-control" } },
          ],
        },
      ],
    },
  ],
};
