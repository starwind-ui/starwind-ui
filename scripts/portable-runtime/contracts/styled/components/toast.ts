import type { RenderNode, StyledAdapterContract } from "../types.js";

type ToastVariant = "default" | "error" | "info" | "loading" | "success" | "warning";

const toastTemplateVariants: ToastVariant[] = [
  "default",
  "success",
  "error",
  "warning",
  "info",
  "loading",
];

const toastIconImports = [
  {
    importName: "AlertTriangle",
    source: "@tabler/icons/outline/alert-triangle.svg",
    type: "default",
  },
  { importName: "CircleCheck", source: "@tabler/icons/outline/circle-check.svg", type: "default" },
  { importName: "CircleX", source: "@tabler/icons/outline/circle-x.svg", type: "default" },
  { importName: "InfoCircle", source: "@tabler/icons/outline/info-circle.svg", type: "default" },
  { importName: "Loader2", source: "@tabler/icons/outline/loader-2.svg", type: "default" },
] as const;

const closeIconImport = {
  importName: "X",
  source: "@tabler/icons/outline/x.svg",
  type: "default",
} as const;

function renderVariantIcon(variantExpression = "variant"): RenderNode[] {
  return [
    {
      type: "conditional",
      condition: `${variantExpression} === "success"`,
      then: [{ type: "icon", importName: "CircleCheck" }],
      else: [],
    },
    {
      type: "conditional",
      condition: `${variantExpression} === "error"`,
      then: [{ type: "icon", importName: "CircleX" }],
      else: [],
    },
    {
      type: "conditional",
      condition: `${variantExpression} === "warning"`,
      then: [{ type: "icon", importName: "AlertTriangle" }],
      else: [],
    },
    {
      type: "conditional",
      condition: `${variantExpression} === "info"`,
      then: [{ type: "icon", importName: "InfoCircle" }],
      else: [],
    },
    {
      type: "conditional",
      condition: `${variantExpression} === "loading"`,
      then: [
        {
          type: "icon",
          importName: "Loader2",
          attrs: [{ name: "class", value: { type: "literal", value: "animate-spin" } }],
        },
      ],
      else: [],
    },
  ];
}

function renderStaticVariantIcon(variant: ToastVariant): RenderNode[] {
  if (variant === "success") {
    return [{ type: "icon", importName: "CircleCheck" }];
  }

  if (variant === "error") {
    return [{ type: "icon", importName: "CircleX" }];
  }

  if (variant === "warning") {
    return [{ type: "icon", importName: "AlertTriangle" }];
  }

  if (variant === "info") {
    return [{ type: "icon", importName: "InfoCircle" }];
  }

  if (variant === "loading") {
    return [
      {
        type: "icon",
        importName: "Loader2",
        attrs: [{ name: "class", value: { type: "literal", value: "animate-spin" } }],
      },
    ];
  }

  return [];
}

function renderTemplateChildren(
  variantExpression = "variant",
  options: { iconNodes?: RenderNode[]; itemVariantExpression?: string } = {},
): RenderNode[] {
  const itemVariantExpression =
    options.itemVariantExpression ??
    `${variantExpression} === "loading" ? "default" : ${variantExpression}`;
  const iconNodes = options.iconNodes ?? renderVariantIcon(variantExpression);

  return [
    {
      type: "primitive",
      component: "toast",
      part: "Root",
      attrs: [
        {
          name: "class",
          value: {
            type: "classVariant",
            variant: "toastItem",
            args: { variant: itemVariantExpression },
          },
        },
        {
          name: "variant",
          value: { type: "raw", code: itemVariantExpression },
        },
        { name: "data-slot", value: { type: "literal", value: "toast" } },
      ],
      children: [
        {
          type: "primitive",
          component: "toast",
          part: "Content",
          attrs: [
            { name: "class", value: { type: "classVariant", variant: "toastContent" } },
            { name: "data-slot", value: { type: "literal", value: "toast-content" } },
          ],
          children: [
            {
              type: "primitive",
              component: "toast",
              part: "Title",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "toastTitle",
                    args: { variant: variantExpression },
                  },
                },
                { name: "data-slot", value: { type: "literal", value: "toast-title" } },
              ],
              children: [
                ...iconNodes,
                {
                  type: "primitive",
                  component: "toast",
                  part: "TitleText",
                  attrs: [
                    { name: "data-slot", value: { type: "literal", value: "toast-title-text" } },
                  ],
                  children: [{ type: "text", value: "Title" }],
                },
              ],
            },
            {
              type: "primitive",
              component: "toast",
              part: "Description",
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "toastDescription" } },
                { name: "data-slot", value: { type: "literal", value: "toast-description" } },
              ],
              children: [{ type: "text", value: "Description" }],
            },
            {
              type: "primitive",
              component: "toast",
              part: "Action",
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "toastAction" } },
                { name: "data-slot", value: { type: "literal", value: "toast-action" } },
              ],
              children: [{ type: "text", value: "Action" }],
            },
          ],
        },
        {
          type: "primitive",
          component: "toast",
          part: "Close",
          attrs: [
            { name: "class", value: { type: "classVariant", variant: "toastClose" } },
            { name: "data-slot", value: { type: "literal", value: "toast-close" } },
          ],
          children: [
            {
              type: "icon",
              importName: "X",
              attrs: [{ name: "class", value: { type: "literal", value: "size-4" } }],
            },
          ],
        },
      ],
    },
  ];
}

function renderDefaultTemplate(variant: ToastVariant): RenderNode {
  const itemVariant = variant === "loading" ? "default" : variant;

  return {
    type: "primitive",
    component: "toast",
    part: "Template",
    attrs: [{ name: "variant", value: { type: "literal", value: variant } }],
    children: renderTemplateChildren(JSON.stringify(variant), {
      iconNodes: renderStaticVariantIcon(variant),
      itemVariantExpression: JSON.stringify(itemVariant),
    }),
  };
}

export const toastStyledContract: StyledAdapterContract = {
  component: "toast",
  publicExports: [
    "Toaster",
    "ToastAction",
    "ToastClose",
    "ToastContent",
    "ToastDescription",
    "ToastItem",
    "ToastTemplate",
    "ToastTitle",
  ],
  defaultExport: {
    Viewport: "Toaster",
    Template: "ToastTemplate",
    Item: "ToastItem",
    Content: "ToastContent",
    Title: "ToastTitle",
    Description: "ToastDescription",
    Action: "ToastAction",
    Close: "ToastClose",
  },
  variantCollectionName: "ToastVariants",
  styles: {
    importFrom: ["Toaster"],
    content: [
      '[data-sw-toast-viewport] [data-slot="toast"] {',
      "  --scale: max(0.9, 1 - (var(--toast-index, 0) * 0.05));",
      "  z-index: calc(1000 - var(--toast-index, 0));",
      "  transform: translateX(var(--toast-swipe-movement-x, 0px))",
      "    translateY(calc(var(--toast-swipe-movement-y, 0px) - (var(--toast-index, 0) * var(--peek))))",
      "    scale(var(--scale));",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-swiping] {',
      "  transition: none;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-expanded] {',
      "  --scale: 1;",
      "  transform: translateX(var(--toast-swipe-movement-x, 0px))",
      "    translateY(calc(var(--toast-swipe-movement-y, 0px) - var(--toast-offset-y, 0px)));",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-state="closed"][data-swipe-direction="down"] {',
      "  transform: translateY(calc(var(--toast-swipe-movement-y, 0px) + 150%));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-state="closed"][data-swipe-direction="up"] {',
      "  transform: translateY(calc(var(--toast-swipe-movement-y, 0px) - 150%));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-state="closed"][data-swipe-direction="right"] {',
      "  transform: translateX(calc(var(--toast-swipe-movement-x, 0px) + 150%))",
      "    translateY(calc(var(--toast-offset-y, 0px) * -1));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-state="closed"][data-swipe-direction="left"] {',
      "  transform: translateX(calc(var(--toast-swipe-movement-x, 0px) - 150%))",
      "    translateY(calc(var(--toast-offset-y, 0px) * -1));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport][data-position^="top"] [data-slot="toast"] {',
      "  top: 0;",
      "  bottom: auto;",
      "  transform-origin: top center;",
      "  transform: translateX(var(--toast-swipe-movement-x, 0px))",
      "    translateY(calc(var(--toast-swipe-movement-y, 0px) + (var(--toast-index, 0) * var(--peek))))",
      "    scale(var(--scale));",
      "}",
      '[data-sw-toast-viewport][data-position^="top"] [data-slot="toast"][data-expanded] {',
      "  transform: translateX(var(--toast-swipe-movement-x, 0px))",
      "    translateY(calc(var(--toast-swipe-movement-y, 0px) + var(--toast-offset-y, 0px)));",
      "}",
      '[data-sw-toast-viewport][data-position^="top"]',
      '  [data-slot="toast"][data-state="closed"][data-swipe-direction="left"] {',
      "  transform: translateX(calc(var(--toast-swipe-movement-x, 0px) - 150%))",
      "    translateY(var(--toast-offset-y, 0px));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport][data-position^="top"]',
      '  [data-slot="toast"][data-state="closed"][data-swipe-direction="right"] {',
      "  transform: translateX(calc(var(--toast-swipe-movement-x, 0px) + 150%))",
      "    translateY(var(--toast-offset-y, 0px));",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-starting-style] {',
      "  transform: translateY(150%);",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport] [data-slot="toast"][data-state="closed"]:not([data-swipe-direction]) {',
      "  transform: translateY(150%);",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport][data-position^="top"] [data-slot="toast"][data-starting-style] {',
      "  transform: translateY(-150%);",
      "  opacity: 0;",
      "}",
      '[data-sw-toast-viewport][data-position^="top"]',
      '  [data-slot="toast"][data-state="closed"]:not([data-swipe-direction]) {',
      "  transform: translateY(-150%);",
      "  opacity: 0;",
      "}",
    ],
  },
  variants: {
    toastAction: {
      base: [
        "border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-outline/50 mt-2 inline-flex h-8 w-fit items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
      ],
    },
    toastClose: {
      base: "text-muted-foreground hover:text-foreground absolute top-2 right-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none",
    },
    toastContent: {
      base: "grid gap-1 transition-opacity duration-200 data-behind:opacity-0 data-expanded:opacity-100",
    },
    toastDescription: {
      base: "text-muted-foreground text-sm",
    },
    toastItem: {
      base: "bg-popover text-popover-foreground pointer-events-auto absolute inset-x-0 bottom-0 flex w-full origin-bottom flex-col gap-1 overflow-hidden rounded-lg border bg-clip-padding p-4 pr-10 shadow-lg transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-limited:pointer-events-none data-limited:opacity-0",
      variants: {
        variant: {
          default: "border-border",
          success: "border-success/80",
          error: "border-error/80",
          warning: "border-warning/80",
          info: "border-info/80",
        },
      },
      defaultVariants: { variant: "default" },
    },
    toastTitle: {
      base: "flex items-center gap-1 text-sm font-semibold [&_svg]:size-4",
      variants: {
        variant: {
          default: "",
          success: "[&_svg]:text-success",
          error: "[&_svg]:text-error",
          warning: "[&_svg]:text-warning",
          info: "[&_svg]:text-info",
          loading: "[&_svg]:text-muted-foreground",
        },
      },
      defaultVariants: { variant: "default" },
    },
    toastViewport: {
      base: [
        "fixed z-50 flex w-80 outline-none",
        "data-[position=bottom-center]:bottom-4 data-[position=bottom-center]:left-1/2 data-[position=bottom-center]:-translate-x-1/2",
        "data-[position=bottom-left]:bottom-4 data-[position=bottom-left]:left-4",
        "data-[position=bottom-right]:right-4 data-[position=bottom-right]:bottom-4",
        "data-[position=top-center]:top-4 data-[position=top-center]:left-1/2 data-[position=top-center]:-translate-x-1/2",
        "data-[position=top-left]:top-4 data-[position=top-left]:left-4",
        "data-[position=top-right]:top-4 data-[position=top-right]:right-4",
      ],
    },
  },
  components: [
    {
      exportName: "Toaster",
      primitiveAliases: { toast: "ToastPrimitive" },
      imports: [...toastIconImports, closeIconImport],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          {
            name: "position",
            optional: true,
            type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
          },
          { name: "limit", optional: true, type: "number" },
          { name: "gap", optional: true, type: "string" },
          { name: "peek", optional: true, type: "string" },
          { name: "duration", optional: true, type: "number" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "duration", defaultValue: "5000" },
          { name: "gap", defaultValue: '"0.5rem"' },
          { name: "limit", defaultValue: "3" },
          { name: "peek", defaultValue: '"1rem"' },
          { name: "position", defaultValue: '"bottom-right"' },
          { name: "style" },
        ],
        rest: "rest",
      },
      variables: [
        {
          frameworks: ["astro"],
          name: "viewportStyle",
          value: {
            type: "raw",
            code: '[`--gap: ${gap}`, `--peek: ${peek}`, style].filter(Boolean).join("; ")',
          },
        },
        {
          frameworks: ["react"],
          name: "viewportStyle",
          value: {
            type: "raw",
            code: '{ "--gap": gap, "--peek": peek, ...(style ?? {}) } as React.CSSProperties & Record<"--gap" | "--peek", string>',
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Viewport",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toastViewport",
                args: { class: "className" },
              },
            },
            { name: "duration", value: { type: "variable", name: "duration" } },
            { name: "limit", value: { type: "variable", name: "limit" } },
            { name: "position", value: { type: "variable", name: "position" } },
            { name: "style", value: { type: "variable", name: "viewportStyle" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-viewport" } },
          ],
          children: [
            {
              type: "slot",
              fallback: toastTemplateVariants.map(renderDefaultTemplate),
            },
          ],
        },
      ],
    },
    {
      exportName: "ToastTemplate",
      primitiveAliases: { toast: "ToastPrimitive" },
      imports: [...toastIconImports, closeIconImport],
      props: {
        extends: [{ type: "htmlAttributes", element: "template" }],
        fields: [
          {
            name: "variant",
            optional: true,
            type: '"default" | "error" | "info" | "loading" | "success" | "warning"',
          },
        ],
      },
      destructure: {
        props: [{ name: "variant", defaultValue: '"default"' }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Template",
          attrs: [
            { name: "variant", value: { type: "variable", name: "variant" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
          ],
          children: [{ type: "slot", fallback: renderTemplateChildren("variant") }],
        },
      ],
    },
    {
      exportName: "ToastItem",
      primitiveAliases: { toast: "ToastPrimitive" },
      imports: [closeIconImport],
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "toastItem" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "variant", defaultValue: '"default"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toastItem",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "variant", value: { type: "variable", name: "variant" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast" } },
          ],
          children: [
            {
              type: "primitive",
              component: "toast",
              part: "Content",
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "toastContent" } },
                { name: "data-slot", value: { type: "literal", value: "toast-content" } },
              ],
              children: [{ type: "slot" }],
            },
            {
              type: "primitive",
              component: "toast",
              part: "Close",
              attrs: [
                { name: "class", value: { type: "classVariant", variant: "toastClose" } },
                { name: "data-slot", value: { type: "literal", value: "toast-close" } },
              ],
              children: [
                {
                  type: "icon",
                  importName: "X",
                  attrs: [{ name: "class", value: { type: "literal", value: "size-4" } }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ToastContent",
      primitiveAliases: { toast: "ToastPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Content",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toastContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ToastTitle",
      primitiveAliases: { toast: "ToastPrimitive" },
      imports: [...toastIconImports],
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "toastTitle" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "variant", defaultValue: '"default"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Title",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toastTitle",
                args: { variant: "variant", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-title" } },
          ],
          children: [
            { type: "slot", name: "icon", fallback: renderVariantIcon("variant") },
            {
              type: "primitive",
              component: "toast",
              part: "TitleText",
              attrs: [{ name: "data-slot", value: { type: "literal", value: "toast-title-text" } }],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "ToastDescription",
      primitiveAliases: { toast: "ToastPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Description",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "toastDescription",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-description" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ToastAction",
      primitiveAliases: { toast: "ToastPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "button" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Action",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "toastAction", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-action" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ToastClose",
      primitiveAliases: { toast: "ToastPrimitive" },
      imports: [closeIconImport],
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [{ name: "showIcon", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "showIcon", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "toast",
          part: "Close",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "toastClose", args: { class: "className" } },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "toast-close" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "conditional",
              condition: "showIcon",
              then: [
                {
                  type: "icon",
                  importName: "X",
                  attrs: [{ name: "class", value: { type: "literal", value: "size-4" } }],
                },
              ],
              else: [],
            },
          ],
        },
      ],
    },
  ],
};
