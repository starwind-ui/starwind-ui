import type { StyledAdapterContract } from "../types.js";

export const sheetStyledContract: StyledAdapterContract = {
  component: "sheet",
  publicExports: [
    "Sheet",
    "SheetClose",
    "SheetContent",
    "SheetDescription",
    "SheetFooter",
    "SheetHeader",
    "SheetTitle",
    "SheetTrigger",
  ],
  defaultExport: {
    Root: "Sheet",
    Trigger: "SheetTrigger",
    Content: "SheetContent",
    Header: "SheetHeader",
    Footer: "SheetFooter",
    Title: "SheetTitle",
    Description: "SheetDescription",
    Close: "SheetClose",
  },
  variantCollectionName: "SheetVariants",
  variants: {
    sheetBackdrop: {
      base: [
        "fixed inset-0 top-0 left-0 z-50 hidden h-screen w-screen bg-black/80",
        "data-starting-style:!animate-none data-starting-style:opacity-0",
        "data-[state=open]:animate-in fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
        "data-[state=closed]:duration-300 data-[state=open]:duration-500",
      ],
    },
    sheetContent: {
      base: [
        "bg-background fixed z-50 flex-col gap-4 shadow-lg transition ease-in-out open:flex",
        "data-starting-style:!animate-none data-starting-style:opacity-0",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards",
        "data-[state=closed]:duration-300 data-[state=open]:duration-500",
      ],
      variants: {
        side: {
          right: [
            "slide-out-to-right slide-in-from-right",
            "inset-y-0 right-0 left-auto h-full max-h-[100dvh] w-3/4 border-l sm:max-w-sm",
          ],
          left: [
            "slide-out-to-left slide-in-from-left",
            "inset-y-0 right-auto left-0 h-full max-h-[100dvh] w-3/4 border-r sm:max-w-sm",
          ],
          top: [
            "slide-out-to-top slide-in-from-top",
            "inset-x-0 top-0 bottom-auto h-auto w-full max-w-screen border-b",
          ],
          bottom: [
            "slide-out-to-bottom slide-in-from-bottom",
            "inset-x-0 top-auto bottom-0 h-auto w-full max-w-screen border-t",
          ],
        },
      },
      defaultVariants: {
        side: "right",
      },
    },
    sheetCloseButton: {
      base: [
        "absolute top-4 right-4 rounded-xs [&>svg]:opacity-70 hover:[&>svg]:opacity-100",
        "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
      ],
    },
    sheetDescription: {
      base: ["text-muted-foreground text-sm"],
    },
    sheetFooter: {
      base: ["mt-auto flex flex-col gap-2 p-4"],
    },
    sheetHeader: {
      base: ["flex flex-col gap-1.5 p-4"],
    },
    sheetTitle: {
      base: ["text-foreground font-heading font-semibold"],
    },
  },
  components: [
    {
      exportName: "Sheet",
      primitiveAliases: { drawer: "SheetPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          {
            name: "onCloseComplete",
            optional: true,
            type: '(details: import("@starwind-ui/runtime").DrawerCloseCompleteDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").DrawerOpenChangeDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "modal", defaultValue: "true" },
          { name: "onCloseComplete", frameworks: ["react"] },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "rootClassName",
          value: {
            type: "raw",
            code: "className",
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "drawer",
          part: "Root",
          attrs: [
            { name: "class", value: { type: "variable", name: "rootClassName" } },
            { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
            { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
            { name: "closeOnEscape", value: { type: "variable", name: "closeOnEscape" } },
            {
              name: "closeOnOutsideInteract",
              value: { type: "variable", name: "closeOnOutsideInteract" },
            },
            { name: "modal", value: { type: "variable", name: "modal" } },
            {
              name: "onCloseComplete",
              value: { type: "variable", name: "onCloseComplete" },
              frameworks: ["react"],
            },
            {
              name: "onOpenChange",
              value: { type: "variable", name: "onOpenChange" },
              frameworks: ["react"],
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SheetTrigger",
      primitiveAliases: { drawer: "SheetPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "targetId", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "targetId" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "triggerClassName",
          value: {
            type: "raw",
            code: "className",
          },
        },
        {
          frameworks: ["react"],
          name: "asChildRest",
          value: {
            type: "raw",
            code: "rest as unknown as React.HTMLAttributes<HTMLDivElement>",
          },
        },
      ],
      render: [
        {
          type: "conditional",
          condition: "asChild",
          then: [
            {
              type: "element",
              tag: "div",
              attrs: [
                { name: "class", value: { type: "variable", name: "triggerClassName" } },
                { name: "data-as-child" },
                {
                  name: "data-sw-drawer-target-id",
                  value: { type: "variable", name: "targetId" },
                },
                {
                  name: "spread",
                  value: { type: "variable", name: "rest" },
                  frameworks: ["astro"],
                },
                {
                  name: "spread",
                  value: { type: "variable", name: "asChildRest" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "sheet-trigger" } },
                { name: "data-sw-drawer-trigger" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "drawer",
              part: "Trigger",
              attrs: [
                { name: "class", value: { type: "variable", name: "triggerClassName" } },
                { name: "targetId", value: { type: "variable", name: "targetId" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "sheet-trigger" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "SheetContent",
      primitiveAliases: { drawer: "SheetPrimitive" },
      imports: [{ type: "default", importName: "X", source: "@tabler/icons/outline/x.svg" }],
      props: {
        extends: [{ type: "htmlAttributes", element: "dialog" }],
        fields: [{ name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "side", defaultValue: '"right"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "slot",
          name: "backdrop",
          fallback: [
            {
              type: "primitive",
              component: "drawer",
              part: "Backdrop",
              selfClosing: true,
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "sheetBackdrop" } },
                { name: "data-state", value: { type: "literal", value: "closed" } },
                { name: "hidden" },
                { name: "data-slot", value: { type: "literal", value: "sheet-backdrop" } },
              ],
            },
          ],
        },
        {
          type: "primitive",
          component: "drawer",
          part: "Popup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "sheetContent",
                args: { side: "side", class: "className" },
              },
            },
            { name: "data-state", value: { type: "literal", value: "closed" } },
            { name: "side", value: { type: "variable", name: "side" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet-content" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "component",
              component: "button",
              exportName: "Button",
              attrs: [
                { name: "variant", value: { type: "literal", value: "ghost" } },
                { name: "size", value: { type: "literal", value: "icon-sm" } },
                { name: "class", value: { type: "classVariant", variant: "sheetCloseButton" } },
                { name: "data-slot", value: { type: "literal", value: "sheet-close" } },
                { name: "data-sw-drawer-close" },
              ],
              children: [
                {
                  type: "slot",
                  name: "icon",
                  fallback: [
                    {
                      type: "icon",
                      importName: "X",
                      attrs: [
                        {
                          name: "class",
                          value: { type: "literal", value: "size-5 transition-opacity" },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                  children: [{ type: "text", value: "Close sheet" }],
                },
              ],
            },
            {
              type: "element",
              tag: "div",
              attrs: [
                {
                  name: "class",
                  value: { type: "literal", value: "pointer-events-none fixed inset-0" },
                },
                { name: "data-floating-root" },
                { name: "data-slot", value: { type: "literal", value: "floating-root" } },
              ],
              selfClosing: true,
            },
          ],
        },
      ],
    },
    {
      exportName: "SheetHeader",
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
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "sheetHeader",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet-header" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SheetFooter",
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
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "sheetFooter",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet-footer" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SheetTitle",
      primitiveAliases: { drawer: "SheetPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "h2" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "drawer",
          part: "Title",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "sheetTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SheetDescription",
      primitiveAliases: { drawer: "SheetPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "p" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "drawer",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "sheetDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "sheet-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "SheetClose",
      primitiveAliases: { drawer: "SheetPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [{ name: "asChild", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "closeClassName",
          value: {
            type: "raw",
            code: "className",
          },
        },
        {
          frameworks: ["react"],
          name: "asChildRest",
          value: {
            type: "raw",
            code: "rest as unknown as React.HTMLAttributes<HTMLDivElement>",
          },
        },
      ],
      render: [
        {
          type: "conditional",
          condition: "asChild",
          then: [
            {
              type: "element",
              tag: "div",
              attrs: [
                { name: "class", value: { type: "variable", name: "closeClassName" } },
                { name: "data-as-child" },
                {
                  name: "spread",
                  value: { type: "variable", name: "rest" },
                  frameworks: ["astro"],
                },
                {
                  name: "spread",
                  value: { type: "variable", name: "asChildRest" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "sheet-close" } },
                { name: "data-sw-drawer-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "drawer",
              part: "Close",
              attrs: [
                { name: "class", value: { type: "variable", name: "closeClassName" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "sheet-close" } },
              ],
              children: [{ type: "slot", fallback: [{ type: "text", value: "Close" }] }],
            },
          ],
        },
      ],
    },
  ],
};
