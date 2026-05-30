import { tv } from "tailwind-variants";

export const sidebar = tv({
  base: "starwind-sidebar group peer text-sidebar-foreground hidden md:block",
});

export const sidebarGap = tv({
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
  defaultVariants: {
    variant: "sidebar",
  },
});

export const sidebarContainer = tv({
  base: [
    "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
  ],
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
      floating: "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
      inset: "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]",
    },
  },
  defaultVariants: {
    side: "left",
    variant: "sidebar",
  },
});

export const sidebarInner = tv({
  base: "bg-sidebar flex h-full w-full flex-col",
  variants: {
    variant: {
      sidebar: "",
      floating: "border-sidebar-border rounded-lg border shadow-sm",
      inset: "border-sidebar-border rounded-lg border shadow-sm",
    },
  },
  defaultVariants: {
    variant: "sidebar",
  },
});

export const sidebarMobileContent = tv({
  base: "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
});

export const sidebarContent = tv({
  base: [
    "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
    "group-data-[collapsible=icon]:overflow-hidden",
  ],
});

export const sidebarFooter = tv({
  base: "flex flex-col gap-2 p-2",
});

export const sidebarGroup = tv({
  base: "relative flex w-full min-w-0 flex-col p-2",
});

export const sidebarGroupContent = tv({
  base: "w-full text-sm",
});

export const sidebarGroupLabel = tv({
  base: [
    "text-sidebar-foreground/70 ring-sidebar-outline",
    "flex h-10 shrink-0 items-center rounded-md px-2 text-sm font-medium",
    "outline-hidden transition-[margin,opacity] duration-200 ease-linear",
    "focus-visible:ring-2",
    "[&>svg]:size-4.5 [&>svg]:shrink-0",
    "group-data-[collapsible=icon]:-mt-10 group-data-[collapsible=icon]:opacity-0",
  ],
});

export const sidebarHeader = tv({
  base: "flex flex-col gap-2 p-2",
});

export const sidebarInput = tv({
  base: "bg-background focus-visible:ring-sidebar-outline h-10 w-full shadow-none focus-visible:ring-2",
});

export const sidebarInset = tv({
  base: [
    "bg-background relative flex w-full flex-1 flex-col",
    "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0",
    "md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
    "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
  ],
});

export const sidebarMenu = tv({
  base: "flex w-full min-w-0 flex-col gap-1",
});

export const sidebarMenuAction = tv({
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
});

export const sidebarMenuBadge = tv({
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
});

export const sidebarMenuButton = tv({
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
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export const sidebarMenuItem = tv({
  base: "group/menu-item relative",
});

export const sidebarMenuSkeleton = tv({
  base: "flex h-8 items-center gap-2 rounded-md px-2",
});

export const sidebarMenuSub = tv({
  base: [
    "border-sidebar-border mx-4.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
    "group-data-[collapsible=icon]:hidden",
  ],
});

export const sidebarMenuSubButton = tv({
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
  defaultVariants: {
    size: "md",
  },
});

export const sidebarProvider = tv({
  base: [
    "starwind-sidebar-provider",
    "group/sidebar-wrapper flex min-h-svh w-full",
    "has-data-[variant=inset]:bg-sidebar",
  ],
});

export const sidebarRail = tv({
  base: [
    "starwind-sidebar-rail",
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
});

export const sidebarSeparator = tv({
  base: "bg-sidebar-border mx-2 w-auto",
});

export const sidebarTrigger = tv({
  base: "starwind-sidebar-trigger",
});
