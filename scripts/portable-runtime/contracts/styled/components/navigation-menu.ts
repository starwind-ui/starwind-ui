import type { StyledAdapterContract } from "../types.js";

export const navigationMenuStyledContract: StyledAdapterContract = {
  component: "navigation-menu",
  publicExports: [
    "NavigationMenu",
    "NavigationMenuContent",
    "NavigationMenuIndicator",
    "NavigationMenuItem",
    "NavigationMenuLink",
    "NavigationMenuList",
    "NavigationMenuPositioner",
    "NavigationMenuTrigger",
  ],
  defaultExport: {
    Root: "NavigationMenu",
    List: "NavigationMenuList",
    Item: "NavigationMenuItem",
    Trigger: "NavigationMenuTrigger",
    Content: "NavigationMenuContent",
    Link: "NavigationMenuLink",
    Indicator: "NavigationMenuIndicator",
    Positioner: "NavigationMenuPositioner",
  },
  variantCollectionName: "NavigationMenuVariants",
  variants: {
    navigationMenu: {
      base: "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
    },
    navigationMenuList: {
      base: [
        "group flex flex-1 list-none items-center justify-center gap-0",
        "group-data-[orientation=vertical]/navigation-menu:flex-col group-data-[orientation=vertical]/navigation-menu:items-stretch",
      ],
    },
    navigationMenuItem: { base: "relative" },
    navigationMenuTrigger: {
      base: [
        "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none",
        "hover:bg-muted focus:bg-muted focus-visible:ring-outline/50 focus-visible:ring-3 focus-visible:outline-1",
        "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-[state=open]:bg-muted/50 data-[state=open]:hover:bg-muted data-[state=open]:focus:bg-muted",
      ],
    },
    navigationMenuIndicator: {
      base: [
        "relative top-px ml-1 size-3 shrink-0 origin-center transition duration-300 [&>svg]:size-3 [&>svg]:shrink-0",
        "group-data-[state=open]/navigation-menu-trigger:rotate-180",
      ],
    },
    navigationMenuContent: {
      base: [
        "data-starting-style:opacity-0 data-ending-style:opacity-0 h-full w-auto p-1 transition-opacity duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] outline-none",
        "data-[state=closed]:pointer-events-none data-[state=closed]:absolute data-[state=closed]:inset-0 data-instant:transition-none",
        "**:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
      ],
    },
    navigationMenuLink: {
      base: [
        "flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none",
        "focus-visible:ring-outline/50 focus-visible:ring-3 focus-visible:outline-1",
        "hover:bg-muted focus:bg-muted data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted",
        "in-data-[slot=navigation-menu-content]:rounded-md [&_svg:not([class*='size-'])]:size-4",
      ],
    },
    navigationMenuPositioner: {
      base: [
        "pointer-events-none h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) data-instant:transition-none isolate z-50 transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0",
      ],
    },
    navigationMenuPopup: {
      base: [
        "data-[ending-style]:easing-[ease] xs:w-(--popup-width) pointer-events-auto h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden bg-popover text-popover-foreground ring-foreground/10 relative rounded-lg shadow outline-none ring-1",
        "data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-90 data-starting-style:opacity-0",
        "transition-[opacity,transform,width,height,scale,translate] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none",
      ],
    },
    navigationMenuViewport: {
      base: "relative size-full overflow-hidden",
    },
  },
  constants: {
    navigationMenuTriggerStyle: "navigationMenuTrigger",
  },
  components: [
    {
      exportName: "NavigationMenu",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "nav",
            keys: ["defaultValue", "onChange", "value"],
          },
        ],
        fields: [
          { name: "defaultValue", optional: true, type: "string | null" },
          { name: "value", optional: true, type: "string | null" },
          { name: "openDelay", optional: true, type: "number" },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
          { name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' },
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "sideOffset", optional: true, type: "number" },
          { name: "alignOffset", optional: true, type: "number" },
          { name: "avoidCollisions", optional: true, type: "boolean" },
          { name: "collisionPadding", optional: true, type: "number" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: string | null, details: import("@starwind-ui/react/navigation-menu").NavigationMenuValueChangeDetails) => void',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultValue", defaultValue: "null" },
          { name: "value" },
          { name: "openDelay", defaultValue: "50" },
          { name: "closeDelay", defaultValue: "50" },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"start"' },
          { name: "sideOffset", defaultValue: "8" },
          { name: "alignOffset", defaultValue: "0" },
          { name: "avoidCollisions", defaultValue: "true" },
          { name: "collisionPadding", defaultValue: "8" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Root",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenu",
                args: { class: "className" },
              },
            },
            { name: "defaultValue", value: { type: "variable", name: "defaultValue" } },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "openDelay", value: { type: "variable", name: "openDelay" } },
            { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
            { name: "closeOnEscape", value: { type: "variable", name: "closeOnEscape" } },
            {
              name: "closeOnOutsideInteract",
              value: { type: "variable", name: "closeOnOutsideInteract" },
            },
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "onValueChange",
              value: { type: "variable", name: "onValueChange" },
              frameworks: ["react"],
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "component",
              component: "navigation-menu",
              exportName: "NavigationMenuPositioner",
              attrs: [
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "alignOffset", value: { type: "variable", name: "alignOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                {
                  name: "collisionPadding",
                  value: { type: "variable", name: "collisionPadding" },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "NavigationMenuList",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "ul" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "List",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenuList",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-list" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "NavigationMenuItem",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "li" }],
        fields: [{ name: "value", optional: true, type: "string" }],
      },
      destructure: {
        props: [{ name: "value" }, { name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Item",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenuItem",
                args: { class: "className" },
              },
            },
            { name: "value", value: { type: "variable", name: "value" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "NavigationMenuTrigger",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "button" }],
        fields: [
          { name: "asChild", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "openDelay", optional: true, type: "number" },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "showIcon", optional: true, type: "boolean" },
          { name: "iconClass", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "asChild", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "openDelay" },
          { name: "closeDelay" },
          { name: "showIcon", defaultValue: "true" },
          { name: "iconClass", alias: "iconClassName" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "conditional",
          condition: "asChild",
          then: [
            {
              type: "primitive",
              component: "navigation-menu",
              part: "Trigger",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "navigationMenuTrigger",
                    args: { class: "className" },
                  },
                },
                { name: "asChild", value: { type: "variable", name: "asChild" } },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "openDelay", value: { type: "variable", name: "openDelay" } },
                { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "data-slot",
                  value: { type: "literal", value: "navigation-menu-trigger" },
                },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "primitive",
              component: "navigation-menu",
              part: "Trigger",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "navigationMenuTrigger",
                    args: { class: "className" },
                  },
                },
                { name: "asChild", value: { type: "variable", name: "asChild" } },
                { name: "disabled", value: { type: "variable", name: "disabled" } },
                { name: "openDelay", value: { type: "variable", name: "openDelay" } },
                { name: "closeDelay", value: { type: "variable", name: "closeDelay" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "data-slot",
                  value: { type: "literal", value: "navigation-menu-trigger" },
                },
              ],
              children: [
                { type: "slot" },
                {
                  type: "conditional",
                  condition: "showIcon",
                  then: [
                    {
                      type: "primitive",
                      component: "navigation-menu",
                      part: "Icon",
                      attrs: [
                        {
                          name: "class",
                          value: {
                            type: "classVariant",
                            variant: "navigationMenuIndicator",
                            args: { class: "iconClassName" },
                          },
                        },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "navigation-menu-indicator" },
                        },
                      ],
                      children: [
                        {
                          type: "slot",
                          name: "icon",
                          fallback: [{ type: "icon", importName: "ChevronDown" }],
                        },
                      ],
                    },
                  ],
                  else: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "NavigationMenuIndicator",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: { extends: [{ type: "htmlAttributes", element: "span" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Icon",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenuIndicator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-indicator" } },
          ],
          children: [
            {
              type: "slot",
              fallback: [{ type: "icon", importName: "ChevronDown" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "NavigationMenuContent",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Content",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenuContent",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-content" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "NavigationMenuLink",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "a" }],
        fields: [
          { name: "active", optional: true, type: "boolean" },
          { name: "closeOnClick", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "active", defaultValue: "false" },
          { name: "closeOnClick", defaultValue: "true" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Link",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "navigationMenuLink",
                args: { class: "className" },
              },
            },
            { name: "active", value: { type: "variable", name: "active" } },
            { name: "closeOnClick", value: { type: "variable", name: "closeOnClick" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-link" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "NavigationMenuPositioner",
      primitiveAliases: { "navigation-menu": "NavigationMenuPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' },
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "sideOffset", optional: true, type: "number" },
          { name: "alignOffset", optional: true, type: "number" },
          { name: "avoidCollisions", optional: true, type: "boolean" },
          { name: "collisionPadding", optional: true, type: "number" },
        ],
      },
      destructure: {
        props: [
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"start"' },
          { name: "sideOffset", defaultValue: "8" },
          { name: "alignOffset", defaultValue: "0" },
          { name: "avoidCollisions", defaultValue: "true" },
          { name: "collisionPadding", defaultValue: "8" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "navigation-menu",
          part: "Portal",
          attrs: [
            { name: "data-slot", value: { type: "literal", value: "navigation-menu-portal" } },
          ],
          children: [
            {
              type: "primitive",
              component: "navigation-menu",
              part: "Positioner",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "navigationMenuPositioner",
                    args: { class: "className" },
                  },
                },
                { name: "side", value: { type: "variable", name: "side" } },
                { name: "align", value: { type: "variable", name: "align" } },
                { name: "sideOffset", value: { type: "variable", name: "sideOffset" } },
                { name: "alignOffset", value: { type: "variable", name: "alignOffset" } },
                { name: "avoidCollisions", value: { type: "variable", name: "avoidCollisions" } },
                {
                  name: "collisionPadding",
                  value: { type: "variable", name: "collisionPadding" },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "data-slot",
                  value: { type: "literal", value: "navigation-menu-positioner" },
                },
              ],
              children: [
                {
                  type: "primitive",
                  component: "navigation-menu",
                  part: "Popup",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "navigationMenuPopup" },
                    },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "navigation-menu-popup" },
                    },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "navigation-menu",
                      part: "Viewport",
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "navigationMenuViewport" },
                        },
                        {
                          name: "data-slot",
                          value: { type: "literal", value: "navigation-menu-viewport" },
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
    },
  ],
};
