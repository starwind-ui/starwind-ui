import type {
  AttributeContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../types.js";

const dataSlotField = {
  name: "data-slot",
  optional: true,
  type: "string",
} as const;

const sidebarStyle = [
  ':root:not([data-starwind-sidebar-tooltips="enabled"]) [data-sw-sidebar-tooltip-content] {',
  "  display: none !important;",
  "}",
];

export const sidebarStyledContract: StyledAdapterContract = {
  component: "sidebar",
  publicExports: [
    "Sidebar",
    "SidebarContent",
    "SidebarFooter",
    "SidebarGroup",
    "SidebarGroupAction",
    "SidebarGroupContent",
    "SidebarGroupLabel",
    "SidebarHeader",
    "SidebarInput",
    "SidebarInset",
    "SidebarMenu",
    "SidebarMenuAction",
    "SidebarMenuBadge",
    "SidebarMenuButton",
    "SidebarMenuItem",
    "SidebarMenuSkeleton",
    "SidebarMenuSub",
    "SidebarMenuSubButton",
    "SidebarMenuSubItem",
    "SidebarProvider",
    "SidebarRail",
    "SidebarSeparator",
    "SidebarTrigger",
  ],
  defaultExport: {
    Root: "SidebarProvider",
    Sidebar: "Sidebar",
    Content: "SidebarContent",
    Footer: "SidebarFooter",
    Group: "SidebarGroup",
    GroupAction: "SidebarGroupAction",
    GroupContent: "SidebarGroupContent",
    GroupLabel: "SidebarGroupLabel",
    Header: "SidebarHeader",
    Input: "SidebarInput",
    Inset: "SidebarInset",
    Menu: "SidebarMenu",
    MenuAction: "SidebarMenuAction",
    MenuBadge: "SidebarMenuBadge",
    MenuButton: "SidebarMenuButton",
    MenuItem: "SidebarMenuItem",
    MenuSkeleton: "SidebarMenuSkeleton",
    MenuSub: "SidebarMenuSub",
    MenuSubButton: "SidebarMenuSubButton",
    MenuSubItem: "SidebarMenuSubItem",
    Rail: "SidebarRail",
    Separator: "SidebarSeparator",
    Trigger: "SidebarTrigger",
  },
  styles: {
    content: sidebarStyle,
    importFrom: ["SidebarMenuButton"],
  },
  variantCollectionName: "SidebarVariants",
  variants: {
    sidebar: {
      base: "group peer text-sidebar-foreground hidden md:block",
    },
    sidebarContent: {
      base: [
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        "group-data-[collapsible=icon]:overflow-hidden",
      ],
    },
    sidebarFooter: {
      base: "flex flex-col gap-2 p-2",
    },
    sidebarGap: {
      base: [
        "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
        "group-data-[collapsible=offcanvas]:w-0",
        "group-data-[side=right]:rotate-180",
      ],
      variants: {
        variant: {
          sidebar: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          floating: "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]",
          inset: "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]",
        },
      },
      defaultVariants: { variant: "sidebar" },
    },
    sidebarContainer: {
      base: "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
      variants: {
        side: {
          left: "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
          right: "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
        },
        variant: {
          sidebar: [
            "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
            "group-data-[side=left]:border-r group-data-[side=right]:border-l",
          ],
          floating:
            "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
          inset: "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
        },
      },
      defaultVariants: { side: "left", variant: "sidebar" },
    },
    sidebarGroup: {
      base: "relative flex w-full min-w-0 flex-col p-2",
    },
    sidebarGroupAction: {
      base: [
        "text-sidebar-foreground ring-sidebar-outline",
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0",
        "outline-hidden transition-transform",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2",
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      ],
    },
    sidebarGroupContent: {
      base: "w-full text-sm",
    },
    sidebarGroupLabel: {
      base: [
        "text-sidebar-foreground/70 ring-sidebar-outline",
        "flex h-10 shrink-0 items-center rounded-md px-2 text-sm font-medium",
        "outline-hidden transition-[margin,opacity] duration-200 ease-linear",
        "focus-visible:ring-2",
        "[&>svg]:size-4.5 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:-mt-10 group-data-[collapsible=icon]:opacity-0",
      ],
    },
    sidebarHeader: {
      base: "flex flex-col gap-2 p-2",
    },
    sidebarInner: {
      base: "bg-sidebar flex h-full w-full flex-col",
      variants: {
        variant: {
          sidebar: "",
          floating: "border-sidebar-border rounded-lg border shadow-sm",
          inset: "border-sidebar-border rounded-lg border shadow-sm",
        },
      },
      defaultVariants: { variant: "sidebar" },
    },
    sidebarInput: {
      base: "bg-background focus-visible:ring-sidebar-outline h-10 w-full shadow-none focus-visible:ring-2",
    },
    sidebarInset: {
      base: [
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
      ],
    },
    sidebarMenu: {
      base: "flex w-full min-w-0 flex-col gap-1",
    },
    sidebarMenuAction: {
      base: [
        "text-sidebar-foreground ring-sidebar-outline",
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0",
        "outline-hidden transition-transform",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "peer-hover/menu-button:text-sidebar-accent-foreground",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
      ],
      variants: {
        showOnHover: {
          true: [
            "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100",
            "data-[state=open]:opacity-100",
            "md:opacity-0",
          ],
        },
      },
    },
    sidebarMenuBadge: {
      base: [
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5",
        "items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground",
        "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
      ],
    },
    sidebarMenuButton: {
      base: [
        "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-2.5 text-left",
        "ring-sidebar-outline outline-hidden transition-[width,height,padding]",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2",
        "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "group-has-data-[sidebar=menu-action]/menu-item:pr-8",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium",
        "data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5!",
        "[&>span:last-child]:truncate [&>svg]:size-4.5 [&>svg]:shrink-0",
      ],
      variants: {
        variant: {
          default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          outline: [
            "bg-background shadow-sidebar-border shadow-xs",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sidebar-accent",
          ],
        },
        size: {
          default: "h-10 text-base",
          sm: "h-8 text-sm",
          lg: "h-14 text-lg group-data-[collapsible=icon]:p-0!",
        },
      },
      defaultVariants: { variant: "default", size: "default" },
    },
    sidebarMenuItem: {
      base: "group/menu-item relative",
    },
    sidebarMenuSkeleton: {
      base: "flex h-8 items-center gap-2 rounded-md px-2",
    },
    sidebarMenuSub: {
      base: [
        "border-sidebar-border mx-4.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
      ],
    },
    sidebarMenuSubButton: {
      base: [
        "text-sidebar-foreground ring-sidebar-outline",
        "flex h-8 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2.5",
        "outline-hidden",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2",
        "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "[&>svg]:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
      ],
      variants: {
        size: {
          sm: "text-sm",
          md: "text-base",
        },
      },
      defaultVariants: { size: "md" },
    },
    sidebarMenuSubItem: {
      base: "group/menu-sub-item relative",
    },
    sidebarMobileContent: {
      base: "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
    },
    sidebarProvider: {
      base: ["group/sidebar-wrapper flex min-h-svh w-full", "has-data-[variant=inset]:bg-sidebar"],
    },
    sidebarRail: {
      base: [
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear sm:flex",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[2px]",
        "hover:after:bg-sidebar-border",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize",
        "[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "group-data-[collapsible=offcanvas]:translate-x-0",
        "group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
      ],
    },
    sidebarSeparator: {
      base: "bg-sidebar-border mx-2 w-auto",
    },
    sidebarTrigger: {
      base: "",
    },
  },
  components: [
    sidebarProviderComponent(),
    sidebarComponent(),
    sidebarTriggerComponent(),
    sidebarRailComponent(),
    simpleElementComponent("SidebarInset", "main", "main", "sidebarInset", "sidebar-inset", {
      refType: "HTMLDivElement",
    }),
    simpleElementComponent("SidebarContent", "div", "div", "sidebarContent", "sidebar-content", {
      dataSidebar: "content",
      refType: "HTMLDivElement",
    }),
    simpleElementComponent("SidebarHeader", "div", "div", "sidebarHeader", "sidebar-header", {
      dataSidebar: "header",
      refType: "HTMLDivElement",
    }),
    simpleElementComponent("SidebarFooter", "div", "div", "sidebarFooter", "sidebar-footer", {
      dataSidebar: "footer",
      refType: "HTMLDivElement",
    }),
    simpleElementComponent("SidebarGroup", "div", "div", "sidebarGroup", "sidebar-group", {
      dataSidebar: "group",
      refType: "HTMLDivElement",
    }),
    sidebarGroupLabelComponent(),
    sidebarGroupActionComponent(),
    simpleElementComponent(
      "SidebarGroupContent",
      "div",
      "div",
      "sidebarGroupContent",
      "sidebar-group-content",
      {
        dataSidebar: "group-content",
        refType: "HTMLDivElement",
      },
    ),
    sidebarInputComponent(),
    sidebarSeparatorComponent(),
    simpleElementComponent("SidebarMenu", "ul", "ul", "sidebarMenu", "sidebar-menu", {
      dataSidebar: "menu",
      refType: "HTMLUListElement",
    }),
    simpleElementComponent("SidebarMenuItem", "li", "li", "sidebarMenuItem", "sidebar-menu-item", {
      dataSidebar: "menu-item",
      refType: "HTMLLIElement",
    }),
    sidebarMenuButtonComponent(),
    sidebarMenuActionComponent(),
    simpleElementComponent(
      "SidebarMenuBadge",
      "div",
      "div",
      "sidebarMenuBadge",
      "sidebar-menu-badge",
      {
        dataSidebar: "menu-badge",
        refType: "HTMLDivElement",
      },
    ),
    sidebarMenuSkeletonComponent(),
    simpleElementComponent("SidebarMenuSub", "ul", "ul", "sidebarMenuSub", "sidebar-menu-sub", {
      dataSidebar: "menu-sub",
      refType: "HTMLUListElement",
    }),
    simpleElementComponent(
      "SidebarMenuSubItem",
      "li",
      "li",
      "sidebarMenuSubItem",
      "sidebar-menu-sub-item",
      {
        dataSidebar: "menu-sub-item",
        refType: "HTMLLIElement",
      },
    ),
    sidebarMenuSubButtonComponent(),
  ],
};

function sidebarProviderComponent(): StyledComponentContract {
  return {
    exportName: "SidebarProvider",
    primitiveAliases: { sidebar: "SidebarPrimitive" },
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        { name: "defaultOpen", optional: true, type: "boolean" },
        { name: "defaultMobileOpen", optional: true, type: "boolean" },
        { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
        { name: "mobileOpen", optional: true, type: "boolean", frameworks: ["react"] },
        {
          name: "onOpenChange",
          optional: true,
          type: '(open: boolean, details: import("@starwind-ui/runtime").SidebarOpenChangeDetails) => void',
          frameworks: ["react"],
        },
        {
          name: "onMobileOpenChange",
          optional: true,
          type: '(open: boolean, details: import("@starwind-ui/runtime").SidebarMobileOpenChangeDetails) => void',
          frameworks: ["react"],
        },
        { name: "keyboardShortcut", optional: true, type: "string" },
        { name: "mobileQuery", optional: true, type: "string" },
        { name: "persistOpen", optional: true, type: "boolean" },
        { name: "persistenceKey", optional: true, type: "string" },
        {
          name: "persistenceStorage",
          optional: true,
          type: '"localStorage" | "cookie" | false',
        },
        { name: "persistenceMaxAge", optional: true, type: "number" },
        { name: "ref", optional: true, type: "React.Ref<HTMLDivElement>", frameworks: ["react"] },
      ],
    },
    destructure: {
      props: [
        { name: "defaultOpen", defaultValue: "true" },
        { name: "defaultMobileOpen", defaultValue: "false" },
        { name: "open", frameworks: ["react"] },
        { name: "mobileOpen", frameworks: ["react"] },
        { name: "onOpenChange", frameworks: ["react"] },
        { name: "onMobileOpenChange", frameworks: ["react"] },
        { name: "keyboardShortcut", defaultValue: '"b"' },
        { name: "mobileQuery", defaultValue: '"(max-width: 767.98px)"' },
        { name: "persistOpen", defaultValue: "false" },
        { name: "persistenceKey" },
        { name: "persistenceStorage" },
        { name: "persistenceMaxAge", defaultValue: "604800" },
        { name: "style" },
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [
      {
        frameworks: ["astro"],
        name: "styleObj",
        value: {
          type: "raw",
          code: 'typeof style === "string" ? {} : ((style as Record<string, string>) ?? {})',
        },
      },
      {
        frameworks: ["astro"],
        name: "providerStyle",
        value: {
          type: "raw",
          code: 'typeof style === "string" ? style : { "--sidebar-width": styleObj["--sidebar-width"] ?? "18rem", "--sidebar-width-icon": styleObj["--sidebar-width-icon"] ?? "3.5rem", ...styleObj }',
        },
      },
      {
        frameworks: ["react"],
        name: "providerStyle",
        value: {
          type: "raw",
          code: '{ "--sidebar-width": "18rem", "--sidebar-width-icon": "3.5rem", ...style } as React.CSSProperties',
        },
      },
    ],
    render: [
      {
        type: "primitive",
        component: "sidebar",
        part: "Provider",
        attrs: [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarProvider",
              args: { class: "className" },
            },
          },
          { name: "defaultOpen", value: { type: "variable", name: "defaultOpen" } },
          { name: "defaultMobileOpen", value: { type: "variable", name: "defaultMobileOpen" } },
          { name: "open", value: { type: "variable", name: "open" }, frameworks: ["react"] },
          {
            name: "mobileOpen",
            value: { type: "variable", name: "mobileOpen" },
            frameworks: ["react"],
          },
          {
            name: "onOpenChange",
            value: { type: "variable", name: "onOpenChange" },
            frameworks: ["react"],
          },
          {
            name: "onMobileOpenChange",
            value: { type: "variable", name: "onMobileOpenChange" },
            frameworks: ["react"],
          },
          { name: "data-keyboard-shortcut", value: { type: "variable", name: "keyboardShortcut" } },
          { name: "data-mobile-query", value: { type: "variable", name: "mobileQuery" } },
          { name: "keyboardShortcut", value: { type: "variable", name: "keyboardShortcut" } },
          { name: "mobileQuery", value: { type: "variable", name: "mobileQuery" } },
          { name: "persistOpen", value: { type: "variable", name: "persistOpen" } },
          { name: "persistenceKey", value: { type: "variable", name: "persistenceKey" } },
          {
            name: "persistenceStorage",
            value: { type: "variable", name: "persistenceStorage" },
          },
          { name: "persistenceMaxAge", value: { type: "variable", name: "persistenceMaxAge" } },
          { name: "style", value: { type: "variable", name: "providerStyle" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          {
            name: "ref",
            value: { type: "variable", name: "ref" },
            frameworks: ["react"],
          },
          { name: "data-slot", value: { type: "literal", value: "sidebar-provider" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

function sidebarComponent(): StyledComponentContract {
  return {
    exportName: "Sidebar",
    primitiveAliases: { sidebar: "SidebarPrimitive" },
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        { name: "side", optional: true, type: '"left" | "right"' },
        { name: "variant", optional: true, type: '"sidebar" | "floating" | "inset"' },
        { name: "collapsible", optional: true, type: '"offcanvas" | "icon" | "none"' },
        { name: "ref", optional: true, type: "React.Ref<HTMLDivElement>", frameworks: ["react"] },
      ],
    },
    destructure: {
      props: [
        { name: "side", defaultValue: '"left"' },
        { name: "variant", defaultValue: '"sidebar"' },
        { name: "collapsible", defaultValue: '"offcanvas"' },
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [
      {
        name: "mobileStyle",
        frameworks: ["astro"],
        value: { type: "raw", code: '{ "--sidebar-width": "18rem" }' },
      },
      {
        name: "mobileStyle",
        frameworks: ["react"],
        value: { type: "raw", code: '{ "--sidebar-width": "18rem" } as React.CSSProperties' },
      },
    ],
    render: [
      {
        type: "conditional",
        condition: 'collapsible === "none"',
        then: [
          {
            type: "element",
            tag: "div",
            attrs: [
              {
                name: "class",
                value: {
                  type: "classJoin",
                  items: [
                    {
                      type: "literal",
                      value:
                        "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
                    },
                    { type: "variable", name: "className" },
                  ],
                },
              },
              { name: "spread", value: { type: "variable", name: "rest" } },
              { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
              { name: "data-slot", value: { type: "literal", value: "sidebar" } },
            ],
            children: [{ type: "slot" }],
          },
        ],
        else: [
          {
            type: "fragment",
            children: [
              {
                type: "primitive",
                component: "sidebar",
                part: "Sidebar",
                attrs: [
                  {
                    name: "class",
                    value: {
                      type: "classVariant",
                      variant: "sidebar",
                      args: { class: "className" },
                    },
                  },
                  { name: "data-state", value: { type: "literal", value: "expanded" } },
                  { name: "data-collapsible", value: { type: "literal", value: "" } },
                  {
                    name: "data-collapsible-mode",
                    value: { type: "variable", name: "collapsible" },
                  },
                  { name: "collapsible", value: { type: "variable", name: "collapsible" } },
                  { name: "data-variant", value: { type: "variable", name: "variant" } },
                  { name: "variant", value: { type: "variable", name: "variant" } },
                  { name: "data-side", value: { type: "variable", name: "side" } },
                  { name: "side", value: { type: "variable", name: "side" } },
                  { name: "data-slot", value: { type: "literal", value: "sidebar" } },
                ],
                children: [
                  {
                    type: "element",
                    tag: "div",
                    attrs: [
                      { name: "data-slot", value: { type: "literal", value: "sidebar-gap" } },
                      {
                        name: "class",
                        value: {
                          type: "classVariant",
                          variant: "sidebarGap",
                          args: { variant: "variant" },
                        },
                      },
                    ],
                    selfClosing: true,
                  },
                  {
                    type: "element",
                    tag: "div",
                    attrs: [
                      {
                        name: "class",
                        value: {
                          type: "classVariant",
                          variant: "sidebarContainer",
                          args: { side: "side", variant: "variant" },
                        },
                      },
                      { name: "spread", value: { type: "variable", name: "rest" } },
                      {
                        name: "ref",
                        value: { type: "variable", name: "ref" },
                        frameworks: ["react"],
                      },
                      { name: "data-slot", value: { type: "literal", value: "sidebar-container" } },
                    ],
                    children: [
                      {
                        type: "element",
                        tag: "div",
                        attrs: [
                          { name: "data-sidebar", value: { type: "literal", value: "sidebar" } },
                          { name: "data-slot", value: { type: "literal", value: "sidebar-inner" } },
                          {
                            name: "class",
                            value: {
                              type: "classVariant",
                              variant: "sidebarInner",
                              args: { variant: "variant" },
                            },
                          },
                        ],
                        children: [{ type: "slot" }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "component",
                component: "sheet",
                exportName: "Sheet",
                attrs: [
                  {
                    name: "class",
                    value: { type: "literal", value: "md:hidden" },
                  },
                  { name: "data-sidebar", value: { type: "literal", value: "mobile" } },
                  { name: "data-slot", value: { type: "literal", value: "sidebar-mobile" } },
                ],
                children: [
                  {
                    type: "component",
                    component: "sheet",
                    exportName: "SheetContent",
                    attrs: [
                      { name: "side", value: { type: "variable", name: "side" } },
                      {
                        name: "class",
                        value: { type: "classVariant", variant: "sidebarMobileContent" },
                      },
                      { name: "style", value: { type: "variable", name: "mobileStyle" } },
                      { name: "data-sidebar", value: { type: "literal", value: "sidebar" } },
                      {
                        name: "data-slot",
                        value: { type: "literal", value: "sidebar-mobile-content" },
                      },
                    ],
                    children: [
                      {
                        type: "component",
                        component: "sheet",
                        exportName: "SheetHeader",
                        attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                        children: [
                          {
                            type: "component",
                            component: "sheet",
                            exportName: "SheetTitle",
                            children: [{ type: "text", value: "Sidebar" }],
                          },
                          {
                            type: "component",
                            component: "sheet",
                            exportName: "SheetDescription",
                            children: [{ type: "text", value: "Mobile navigation sidebar" }],
                          },
                        ],
                      },
                      {
                        type: "element",
                        tag: "div",
                        attrs: [
                          {
                            name: "class",
                            value: { type: "literal", value: "flex h-full w-full flex-col" },
                          },
                        ],
                        children: [{ type: "slot" }],
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
}

function sidebarTriggerComponent(): StyledComponentContract {
  return {
    exportName: "SidebarTrigger",
    primitiveAliases: { sidebar: "SidebarPrimitive" },
    imports: [
      {
        type: "default",
        importName: "LayoutSidebar",
        source: "@tabler/icons/outline/layout-sidebar.svg",
      },
    ],
    props: {
      extends: [{ type: "componentProps", component: "button", exportName: "Button" }],
    },
    destructure: {
      props: [
        { name: "size", defaultValue: '"icon-sm"' },
        { name: "variant", defaultValue: '"ghost"' },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "primitive",
        component: "sidebar",
        part: "Trigger",
        attrs: [{ name: "asChild", value: { type: "literal", value: true } }],
        children: [
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
                  variant: "sidebarTrigger",
                  args: { class: "className" },
                },
              },
              { name: "data-sidebar", value: { type: "literal", value: "trigger" } },
              { name: "aria-label", value: { type: "literal", value: "Toggle Sidebar" } },
              { name: "spread", value: { type: "variable", name: "rest" } },
              { name: "data-slot", value: { type: "literal", value: "sidebar-trigger" } },
            ],
            children: [
              {
                type: "slot",
                name: "icon",
                fallback: [
                  {
                    type: "icon",
                    importName: "LayoutSidebar",
                    attrs: [{ name: "aria-hidden", value: { type: "literal", value: "true" } }],
                  },
                ],
              },
              {
                type: "element",
                tag: "span",
                attrs: [{ name: "class", value: { type: "literal", value: "sr-only" } }],
                children: [{ type: "text", value: "Toggle Sidebar" }],
              },
            ],
          },
        ],
      },
    ],
  };
}

function sidebarRailComponent(): StyledComponentContract {
  return {
    exportName: "SidebarRail",
    primitiveAliases: { sidebar: "SidebarPrimitive" },
    props: {
      extends: [{ type: "htmlAttributes", element: "button" }],
      fields: [
        {
          name: "ref",
          optional: true,
          type: "React.Ref<HTMLButtonElement>",
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
        type: "primitive",
        component: "sidebar",
        part: "Rail",
        attrs: [
          {
            name: "class",
            value: { type: "classVariant", variant: "sidebarRail", args: { class: "className" } },
          },
          { name: "data-sidebar", value: { type: "literal", value: "rail" } },
          { name: "aria-label", value: { type: "literal", value: "Toggle Sidebar" } },
          { name: "tabindex", value: { type: "literal", value: "-1" }, frameworks: ["astro"] },
          { name: "tabIndex", value: { type: "literal", value: -1 }, frameworks: ["react"] },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: "sidebar-rail" } },
        ],
      },
    ],
  };
}

function sidebarGroupLabelComponent(): StyledComponentContract {
  return {
    exportName: "SidebarGroupLabel",
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        { name: "asChild", optional: true, type: "boolean" },
        { name: "ref", optional: true, type: "React.Ref<HTMLDivElement>", frameworks: ["react"] },
      ],
    },
    destructure: {
      props: [
        { name: "asChild", defaultValue: "false" },
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [
      {
        frameworks: ["react"],
        name: "asChildRest",
        value: { type: "raw", code: "rest as unknown as React.HTMLAttributes<HTMLDivElement>" },
      },
    ],
    render: [
      {
        type: "element",
        tag: "div",
        attrs: [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarGroupLabel",
              args: { class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "group-label" } },
          { name: "data-as-child", value: { type: "raw", code: "asChild ? true : undefined" } },
          { name: "spread", value: { type: "variable", name: "rest" }, frameworks: ["astro"] },
          {
            name: "spread",
            value: { type: "variable", name: "asChildRest" },
            frameworks: ["react"],
          },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: "sidebar-group-label" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

function sidebarGroupActionComponent(): StyledComponentContract {
  return {
    exportName: "SidebarGroupAction",
    props: {
      extends: [{ type: "componentProps", component: "button", exportName: "Button" }],
    },
    destructure: {
      props: [
        { name: "variant", defaultValue: '"ghost"' },
        { name: "size", defaultValue: '"icon-sm"' },
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
          { name: "variant", value: { type: "variable", name: "variant" } },
          { name: "size", value: { type: "variable", name: "size" } },
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarGroupAction",
              args: { class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "group-action" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "sidebar-group-action" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

function sidebarInputComponent(): StyledComponentContract {
  return {
    exportName: "SidebarInput",
    props: { extends: [{ type: "componentProps", component: "input", exportName: "Input" }] },
    destructure: {
      props: [
        { name: "size", defaultValue: '"md"' },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "component",
        component: "input",
        exportName: "Input",
        attrs: [
          { name: "size", value: { type: "variable", name: "size" } },
          {
            name: "class",
            value: { type: "classVariant", variant: "sidebarInput", args: { class: "className" } },
          },
          { name: "data-sidebar", value: { type: "literal", value: "input" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "sidebar-input" } },
        ],
      },
    ],
  };
}

function sidebarSeparatorComponent(): StyledComponentContract {
  return {
    exportName: "SidebarSeparator",
    props: {
      extends: [{ type: "componentProps", component: "separator", exportName: "Separator" }],
    },
    destructure: {
      props: [
        { name: "orientation", defaultValue: '"horizontal"' },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "component",
        component: "separator",
        exportName: "Separator",
        attrs: [
          { name: "orientation", value: { type: "variable", name: "orientation" } },
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarSeparator",
              args: { class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "separator" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "sidebar-separator" } },
        ],
      },
    ],
  };
}

function sidebarMenuButtonComponent(): StyledComponentContract {
  const buttonAttrs = [
    { name: "class", value: { type: "variable", name: "buttonClassName" } },
    { name: "data-sidebar", value: { type: "literal", value: "menu-button" } },
    { name: "data-size", value: { type: "variable", name: "size" } },
    { name: "data-active", value: { type: "variable", name: "isActive" } },
    { name: "data-tooltip", value: { type: "variable", name: "tooltip" } },
    { name: "href", value: { type: "variable", name: "href" } },
    { name: "data-slot", value: { type: "literal", value: "sidebar-menu-button" } },
  ] satisfies AttributeContract[];

  const buttonNode: RenderNode = {
    type: "primitive",
    component: "sidebar",
    part: "MenuButton",
    attrs: [{ name: "asChild", value: { type: "literal", value: true } }],
    children: [
      {
        type: "element",
        tag: "Tag",
        attrs: [
          ...buttonAttrs,
          {
            name: "type",
            value: { type: "raw", code: 'Tag === "button" ? "button" : undefined' },
          },
          { name: "data-as-child", value: { type: "raw", code: "asChild ? true : undefined" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };

  return {
    exportName: "SidebarMenuButton",
    primitiveAliases: { sidebar: "SidebarPrimitive" },
    props: {
      extends: [
        { type: "htmlAttributes", element: "button" },
        { type: "omitHtmlAttributes", element: "a", keys: ["type"] },
        { type: "variantProps", variant: "sidebarMenuButton" },
      ],
      fields: [
        { name: "asChild", optional: true, type: "boolean" },
        { name: "isActive", optional: true, type: "boolean" },
        { name: "tooltip", optional: true, type: "string" },
      ],
    },
    destructure: {
      props: [
        { name: "asChild", defaultValue: "false" },
        { name: "isActive", defaultValue: "false" },
        { name: "tooltip" },
        { name: "variant" },
        { name: "size", defaultValue: '"default"' },
        { name: "href" },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [
      {
        name: "Tag",
        frameworks: ["astro"],
        value: { type: "raw", code: 'asChild ? "div" : href ? "a" : "button"' },
      },
      {
        name: "Tag",
        frameworks: ["react"],
        value: {
          type: "raw",
          code: '((asChild ? "div" : href ? "a" : "button") as React.ElementType)',
        },
      },
      {
        name: "buttonClassName",
        value: {
          type: "classVariant",
          variant: "sidebarMenuButton",
          args: { variant: "variant", size: "size", class: "className" },
        },
      },
    ],
    render: [
      {
        type: "conditional",
        condition: "Boolean(tooltip)",
        then: [
          {
            type: "component",
            component: "tooltip",
            exportName: "Tooltip",
            attrs: [
              { name: "openDelay", value: { type: "literal", value: 0 } },
              { name: "closeDelay", value: { type: "literal", value: 0 } },
              {
                name: "class",
                value: { type: "literal", value: "w-full" },
              },
            ],
            children: [
              {
                type: "component",
                component: "tooltip",
                exportName: "TooltipTrigger",
                attrs: [
                  {
                    name: "class",
                    value: { type: "literal", value: "w-full" },
                  },
                ],
                children: [buttonNode],
              },
              {
                type: "component",
                component: "tooltip",
                exportName: "TooltipContent",
                attrs: [
                  { name: "side", value: { type: "literal", value: "right" } },
                  { name: "align", value: { type: "literal", value: "center" } },
                  {
                    name: "class",
                    value: {
                      type: "literal",
                      value: "whitespace-nowrap",
                    },
                  },
                  { name: "data-sw-sidebar-tooltip-content" },
                ],
                children: [{ type: "text", value: "{tooltip}" }],
              },
            ],
          },
        ],
        else: [buttonNode],
      },
    ],
  };
}

function sidebarMenuActionComponent(): StyledComponentContract {
  return {
    exportName: "SidebarMenuAction",
    props: {
      extends: [{ type: "componentProps", component: "button", exportName: "Button" }],
      fields: [{ name: "showOnHover", optional: true, type: "boolean" }],
    },
    destructure: {
      props: [
        { name: "showOnHover", defaultValue: "false" },
        { name: "variant", defaultValue: '"ghost"' },
        { name: "size", defaultValue: '"icon-sm"' },
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
          { name: "variant", value: { type: "variable", name: "variant" } },
          { name: "size", value: { type: "variable", name: "size" } },
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarMenuAction",
              args: { showOnHover: "showOnHover", class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "menu-action" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "sidebar-menu-action" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

function sidebarMenuSkeletonComponent(): StyledComponentContract {
  return {
    exportName: "SidebarMenuSkeleton",
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        { name: "showIcon", optional: true, type: "boolean" },
        { name: "width", optional: true, type: "string" },
      ],
    },
    destructure: {
      props: [
        { name: "showIcon", defaultValue: "false" },
        { name: "width" },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [
      { name: "skeletonWidth", value: { type: "raw", code: 'width ?? "70%"' } },
      {
        name: "skeletonStyle",
        frameworks: ["astro"],
        value: { type: "raw", code: '{ "--skeleton-width": skeletonWidth }' },
      },
      {
        name: "skeletonStyle",
        frameworks: ["react"],
        value: {
          type: "raw",
          code: '{ "--skeleton-width": skeletonWidth } as React.CSSProperties',
        },
      },
    ],
    render: [
      {
        type: "element",
        tag: "div",
        attrs: [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarMenuSkeleton",
              args: { class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "menu-skeleton" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "sidebar-menu-skeleton" } },
        ],
        children: [
          {
            type: "conditional",
            condition: "showIcon",
            then: [
              {
                type: "component",
                component: "skeleton",
                exportName: "Skeleton",
                attrs: [
                  { name: "class", value: { type: "literal", value: "size-4 rounded-md" } },
                  { name: "data-sidebar", value: { type: "literal", value: "menu-skeleton-icon" } },
                ],
              },
            ],
            else: [],
          },
          {
            type: "component",
            component: "skeleton",
            exportName: "Skeleton",
            attrs: [
              {
                name: "class",
                value: { type: "literal", value: "h-4 max-w-(--skeleton-width) flex-1" },
              },
              { name: "style", value: { type: "variable", name: "skeletonStyle" } },
              { name: "data-sidebar", value: { type: "literal", value: "menu-skeleton-text" } },
            ],
          },
        ],
      },
    ],
  };
}

function sidebarMenuSubButtonComponent(): StyledComponentContract {
  return {
    exportName: "SidebarMenuSubButton",
    props: {
      extends: [
        { type: "htmlAttributes", element: "a" },
        { type: "variantProps", variant: "sidebarMenuSubButton" },
      ],
      fields: [
        { name: "isActive", optional: true, type: "boolean" },
        {
          name: "ref",
          optional: true,
          type: "React.Ref<HTMLAnchorElement>",
          frameworks: ["react"],
        },
      ],
    },
    destructure: {
      props: [
        { name: "size", defaultValue: '"md"' },
        { name: "isActive", defaultValue: "false" },
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "element",
        tag: "a",
        attrs: [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "sidebarMenuSubButton",
              args: { size: "size", class: "className" },
            },
          },
          { name: "data-sidebar", value: { type: "literal", value: "menu-sub-button" } },
          { name: "data-size", value: { type: "variable", name: "size" } },
          { name: "data-active", value: { type: "variable", name: "isActive" } },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: "sidebar-menu-sub-button" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

function simpleElementComponent(
  exportName: string,
  tag: string,
  htmlElement: string,
  variant: string,
  slot: string,
  options: {
    dataSidebar?: string;
    refType?: string;
  } = {},
): StyledComponentContract {
  return {
    exportName,
    props: {
      extends: [{ type: "htmlAttributes", element: htmlElement }],
      fields: [
        ...(options.refType
          ? [
              {
                name: "ref",
                optional: true,
                type: `React.Ref<${options.refType}>`,
                frameworks: ["react" as const],
              },
            ]
          : []),
        dataSlotField,
      ],
    },
    destructure: {
      props: [
        ...(options.refType ? [{ name: "ref", frameworks: ["react" as const] }] : []),
        { name: "data-slot", alias: "dataSlot", defaultValue: JSON.stringify(slot) },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "element",
        tag,
        attrs: [
          {
            name: "class",
            value: { type: "classVariant", variant, args: { class: "className" } },
          },
          ...(options.dataSidebar
            ? [
                {
                  name: "data-sidebar",
                  value: { type: "literal" as const, value: options.dataSidebar },
                },
              ]
            : []),
          { name: "spread", value: { type: "variable", name: "rest" } },
          ...(options.refType
            ? [
                {
                  name: "ref",
                  value: { type: "variable" as const, name: "ref" },
                  frameworks: ["react" as const],
                },
              ]
            : []),
          { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}
