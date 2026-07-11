import type { StyledAdapterContract } from "../types.js";

export const dialogStyledContract: StyledAdapterContract = {
  component: "dialog",
  publicExports: [
    "Dialog",
    "DialogClose",
    "DialogContent",
    "DialogDescription",
    "DialogFooter",
    "DialogHeader",
    "DialogTitle",
    "DialogTrigger",
  ],
  defaultExport: {
    Root: "Dialog",
    Trigger: "DialogTrigger",
    Content: "DialogContent",
    Header: "DialogHeader",
    Footer: "DialogFooter",
    Title: "DialogTitle",
    Description: "DialogDescription",
    Close: "DialogClose",
  },
  variantCollectionName: "DialogVariants",
  variants: {
    dialogBackdrop: {
      base: [
        "fixed inset-0 top-0 left-0 z-50 h-screen w-screen bg-black/80 duration-200",
        "data-[state=open]:animate-in fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
      ],
    },
    dialogContent: {
      base: [
        "fixed top-16 left-[50%] z-50 translate-x-[-50%] sm:top-[50%] sm:translate-y-[-50%]",
        "bg-background w-full max-w-md rounded-lg border p-8 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards transition-[translate,scale,opacity] duration-200",
        "fade-in zoom-in-95 slide-in-from-bottom-2",
        "fade-out zoom-out-95 slide-out-to-bottom-2",
        "data-[state=open]:data-nested-dialog-open:-translate-y-[calc(50%-var(--nested-offset)*var(--nested-dialogs,1))]",
        "data-[state=open]:data-nested-dialog-open:scale-[calc(1-var(--nested-scale)*var(--nested-dialogs,1))]",
        "max-sm:data-[state=open]:data-nested-dialog-open:translate-y-[calc(var(--nested-offset)*var(--nested-dialogs,1))]",
      ],
    },
    dialogCloseButton: {
      base: [
        "text-muted-foreground",
        "absolute top-5.5 right-5.5 rounded-sm [&>svg]:opacity-70 hover:[&>svg]:opacity-100",
        "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
      ],
    },
    dialogDescription: { base: "text-muted-foreground" },
    dialogFooter: { base: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" },
    dialogHeader: { base: "flex flex-col space-y-2 text-center sm:text-left" },
    dialogTitle: { base: "font-heading text-xl leading-none font-semibold tracking-tight" },
  },
  styles: {
    content: [
      "[data-sw-dialog-content] {",
      "  --nested-offset: 1rem;",
      "  --nested-scale: 0.05;",
      "}",
    ],
    importFrom: ["DialogContent"],
  },
  components: [
    {
      exportName: "Dialog",
      primitiveAliases: { dialog: "DialogPrimitive" },
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
            type: '(details: import("@starwind-ui/runtime").DialogCloseCompleteDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").DialogOpenChangeDetails) => void',
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
          component: "dialog",
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
            { name: "data-slot", value: { type: "literal", value: "dialog" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DialogTrigger",
      primitiveAliases: { dialog: "DialogPrimitive" },
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
                  name: "data-sw-dialog-target-id",
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
                { name: "data-slot", value: { type: "literal", value: "dialog-trigger" } },
                { name: "data-sw-dialog-trigger" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "dialog",
              part: "Trigger",
              attrs: [
                { name: "class", value: { type: "variable", name: "triggerClassName" } },
                { name: "targetId", value: { type: "variable", name: "targetId" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "dialog-trigger" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "DialogContent",
      primitiveAliases: { dialog: "DialogPrimitive" },
      imports: [{ type: "default", importName: "X", source: "@tabler/icons/outline/x.svg" }],
      props: { extends: [{ type: "htmlAttributes", element: "dialog" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "slot",
          name: "backdrop",
          fallback: [
            {
              type: "primitive",
              component: "dialog",
              part: "Backdrop",
              selfClosing: true,
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "dialogBackdrop" } },
                { name: "data-state", value: { type: "literal", value: "closed" } },
                { name: "hidden" },
                { name: "data-slot", value: { type: "literal", value: "dialog-backdrop" } },
              ],
            },
          ],
        },
        {
          type: "primitive",
          component: "dialog",
          part: "Popup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dialogContent",
                args: { class: "className" },
              },
            },
            { name: "data-state", value: { type: "literal", value: "closed" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dialog-content" } },
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
                { name: "class", value: { type: "classVariant", variant: "dialogCloseButton" } },
                { name: "aria-label", value: { type: "literal", value: "Close dialog" } },
                { name: "data-slot", value: { type: "literal", value: "dialog-close" } },
                { name: "data-sw-dialog-close" },
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
                  children: [{ type: "text", value: "Close" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "DialogHeader",
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
                variant: "dialogHeader",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dialog-header" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DialogFooter",
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
                variant: "dialogFooter",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dialog-footer" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DialogTitle",
      primitiveAliases: { dialog: "DialogPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "h2" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dialog",
          part: "Title",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dialogTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dialog-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DialogDescription",
      primitiveAliases: { dialog: "DialogPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "p" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "dialog",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "dialogDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "dialog-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "DialogClose",
      primitiveAliases: { dialog: "DialogPrimitive" },
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
                { name: "data-slot", value: { type: "literal", value: "dialog-close" } },
                { name: "data-sw-dialog-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "dialog",
              part: "Close",
              attrs: [
                { name: "class", value: { type: "variable", name: "closeClassName" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "dialog-close" } },
              ],
              children: [{ type: "slot", fallback: [{ type: "text", value: "Close" }] }],
            },
          ],
        },
      ],
    },
  ],
};
