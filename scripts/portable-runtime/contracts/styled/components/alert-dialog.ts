import type { ClassVariantDefinition, StyledAdapterContract } from "../types.js";

import { buttonStyledContract } from "./button.js";

const buttonVariant = buttonStyledContract.variants!.button;

function createAlertDialogAsChildButtonVariant(
  slotClass: string,
  defaultVariant: string,
): ClassVariantDefinition {
  return {
    base: [
      ...(slotClass ? [slotClass] : []),
      ...(Array.isArray(buttonVariant.base) ? buttonVariant.base : [buttonVariant.base!]),
    ],
    variants: buttonVariant.variants,
    defaultVariants: { ...buttonVariant.defaultVariants, variant: defaultVariant, size: "md" },
  };
}

export const alertDialogStyledContract: StyledAdapterContract = {
  component: "alert-dialog",
  publicExports: [
    "AlertDialog",
    "AlertDialogAction",
    "AlertDialogCancel",
    "AlertDialogContent",
    "AlertDialogDescription",
    "AlertDialogFooter",
    "AlertDialogHeader",
    "AlertDialogTitle",
    "AlertDialogTrigger",
  ],
  defaultExport: {
    Root: "AlertDialog",
    Trigger: "AlertDialogTrigger",
    Content: "AlertDialogContent",
    Header: "AlertDialogHeader",
    Footer: "AlertDialogFooter",
    Title: "AlertDialogTitle",
    Description: "AlertDialogDescription",
    Action: "AlertDialogAction",
    Cancel: "AlertDialogCancel",
  },
  variantCollectionName: "AlertDialogVariants",
  variants: {
    alertDialogBackdrop: {
      base: [
        "fixed inset-0 z-50 hidden bg-black/50 duration-200",
        "data-[state=open]:animate-in fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
      ],
    },
    alertDialogContent: {
      base: [
        "bg-background space-y-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
        "fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
        "data-[state=open]:animate-in fade-in zoom-in-95 will-change-transform duration-200",
        "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
      ],
    },
    alertDialogDescription: { base: "text-muted-foreground" },
    alertDialogFooter: {
      base: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
    },
    alertDialogHeader: { base: "flex flex-col gap-2 text-center sm:text-left" },
    alertDialogTitle: { base: "font-heading text-xl font-semibold" },
    alertDialogAction: {
      base: "",
    },
    alertDialogActionAsChild: createAlertDialogAsChildButtonVariant("", "default"),
    alertDialogCancel: {
      base: "",
    },
    alertDialogCancelAsChild: createAlertDialogAsChildButtonVariant("", "outline"),
  },
  components: [
    {
      exportName: "AlertDialog",
      primitiveAliases: { "alert-dialog": "AlertDialogPrimitive" },
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
            type: '(details: import("@starwind-ui/runtime").AlertDialogCloseCompleteDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onOpenChange",
            optional: true,
            type: '(open: boolean, details: import("@starwind-ui/runtime").AlertDialogOpenChangeDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "false" },
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
          component: "alert-dialog",
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
            { name: "data-slot", value: { type: "literal", value: "alert-dialog" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogTrigger",
      primitiveAliases: { "alert-dialog": "AlertDialogPrimitive" },
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
                  name: "data-sw-alert-dialog-target-id",
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
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-trigger" } },
                { name: "data-sw-alert-dialog-trigger" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "alert-dialog",
              part: "Trigger",
              attrs: [
                { name: "class", value: { type: "variable", name: "triggerClassName" } },
                { name: "targetId", value: { type: "variable", name: "targetId" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-trigger" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "AlertDialogContent",
      primitiveAliases: { "alert-dialog": "AlertDialogPrimitive" },
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
              component: "alert-dialog",
              part: "Backdrop",
              selfClosing: true,
              attrs: [
                {
                  name: "class",
                  value: { type: "classVariant", variant: "alertDialogBackdrop" },
                },
                { name: "data-state", value: { type: "literal", value: "closed" } },
                { name: "hidden" },
                {
                  name: "data-slot",
                  value: { type: "literal", value: "alert-dialog-backdrop" },
                },
              ],
            },
          ],
        },
        {
          type: "primitive",
          component: "alert-dialog",
          part: "Popup",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alertDialogContent",
                args: { class: "className" },
              },
            },
            { name: "role", value: { type: "literal", value: "alertdialog" } },
            { name: "data-state", value: { type: "literal", value: "closed" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "alert-dialog-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogHeader",
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
                variant: "alertDialogHeader",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "alert-dialog-header" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogFooter",
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
                variant: "alertDialogFooter",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "alert-dialog-footer" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogTitle",
      primitiveAliases: { "alert-dialog": "AlertDialogPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "h2" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "alert-dialog",
          part: "Title",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alertDialogTitle",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "alert-dialog-title" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogDescription",
      primitiveAliases: { "alert-dialog": "AlertDialogPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "p" }] },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "alert-dialog",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "alertDialogDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "data-slot",
              value: { type: "literal", value: "alert-dialog-description" },
            },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "AlertDialogAction",
      props: {
        extends: [{ type: "componentProps", component: "button", exportName: "Button" }],
        fields: [{ name: "asChild", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "variant", defaultValue: '"default"' },
          { name: "size", defaultValue: '"md"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
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
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "alertDialogActionAsChild",
                    args: { variant: "variant", size: "size", class: "className" },
                  },
                },
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
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-action" } },
                { name: "data-sw-alert-dialog-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "component",
              component: "button",
              exportName: "Button",
              attrs: [
                { name: "variant", value: { type: "variable", name: "variant" } },
                { name: "size", value: { type: "variable", name: "size" } },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "alertDialogAction",
                    args: { class: "className" },
                  },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-action" } },
                { name: "data-sw-alert-dialog-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "AlertDialogCancel",
      props: {
        extends: [{ type: "componentProps", component: "button", exportName: "Button" }],
        fields: [{ name: "asChild", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "variant", defaultValue: '"outline"' },
          { name: "size", defaultValue: '"md"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
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
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "alertDialogCancelAsChild",
                    args: { variant: "variant", size: "size", class: "className" },
                  },
                },
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
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-cancel" } },
                { name: "data-sw-alert-dialog-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "component",
              component: "button",
              exportName: "Button",
              attrs: [
                { name: "variant", value: { type: "variable", name: "variant" } },
                { name: "size", value: { type: "variable", name: "size" } },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "alertDialogCancel",
                    args: { class: "className" },
                  },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "alert-dialog-cancel" } },
                { name: "data-sw-alert-dialog-close" },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
  ],
};
