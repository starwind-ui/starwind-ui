import type { StyledAdapterContract } from "../types.js";

export const tabsStyledContract: StyledAdapterContract = {
  component: "tabs",
  publicExports: ["Tabs", "TabsContent", "TabsList", "TabsTrigger"],
  defaultExport: {
    Root: "Tabs",
    List: "TabsList",
    Trigger: "TabsTrigger",
    Content: "TabsContent",
  },
  variantCollectionName: "TabsVariants",
  variants: {
    tabs: { base: "" },
    tabsContent: {
      base: "mt-2 focus-visible:outline-2 focus-visible:outline-offset-2",
    },
    tabsList: {
      base: "bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-md p-1",
    },
    tabsTrigger: {
      base: [
        "inline-flex grow items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-1.5 font-medium whitespace-nowrap transition-[color,box-shadow]",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:outline-outline focus-visible:ring-3 focus-visible:outline-1",
        "disabled:pointer-events-none disabled:opacity-50",
      ],
    },
  },
  components: [
    {
      exportName: "Tabs",
      primitiveAliases: { tabs: "TabsPrimitive" },
      props: {
        declaration: "interface",
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "div",
            keys: ["defaultValue", "onChange", "value"],
          },
        ],
        fields: [
          {
            name: "defaultValue",
            optional: true,
            type: "string | null",
            frameworks: ["astro"],
          },
          {
            name: "defaultValue",
            optional: true,
            type: 'import("@starwind-ui/runtime").TabsValue',
            frameworks: ["react"],
          },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime").TabsValue, details: import("@starwind-ui/runtime").TabsValueChangeDetails) => void',
            frameworks: ["react"],
          },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "syncKey", optional: true, type: "string" },
          { name: "value", optional: true, type: "string | null", frameworks: ["astro"] },
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime").TabsValue',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultValue" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "ref", frameworks: ["react"] },
          { name: "syncKey" },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tabs",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "tabs", args: { class: "className" } },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "syncKey", value: { type: "variable", name: "syncKey" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "tabs" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "TabsList",
      primitiveAliases: { tabs: "TabsPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "activateOnFocus", optional: true, type: "boolean" },
          { name: "loopFocus", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "activateOnFocus" },
          { name: "loopFocus" },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tabs",
          part: "List",
          attrs: [
            {
              name: "class",
              value: { type: "classVariant", variant: "tabsList", args: { class: "className" } },
            },
            { name: "activateOnFocus", value: { type: "variable", name: "activateOnFocus" } },
            { name: "loopFocus", value: { type: "variable", name: "loopFocus" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "tabs-list" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "TabsTrigger",
      primitiveAliases: { tabs: "TabsPrimitive" },
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "button", keys: ["type", "value"] }],
        fields: [
          { name: "disabled", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLButtonElement>",
            frameworks: ["react"],
          },
          { name: "value", type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "disabled", defaultValue: "false" },
          { name: "ref", frameworks: ["react"] },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tabs",
          part: "Tab",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "tabsTrigger",
                args: { class: "className" },
              },
            },
            { name: "disabled", value: { type: "variable", name: "disabled" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "tabs-trigger" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "TabsContent",
      primitiveAliases: { tabs: "TabsPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "keepMounted", optional: true, type: "boolean" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
          { name: "value", type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "keepMounted" },
          { name: "ref", frameworks: ["react"] },
          { name: "value" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "tabs",
          part: "Panel",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "tabsContent",
                args: { class: "className" },
              },
            },
            { name: "keepMounted", value: { type: "variable", name: "keepMounted" } },
            { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "tabs-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
