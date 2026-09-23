<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { Button } from "../button/index.js";

  export type SidebarMenuActionProps = ComponentProps<typeof Button> & {children?:Snippet; "showOnHover"?:boolean;  };
</script>

<script lang="ts">
  let {
    "showOnHover": showOnHover = false,
    "variant": variant = "ghost",
    "size": size = "icon-sm",
    "class": className,
    "children": children,
    ...rest
  }: SidebarMenuActionProps = $props();
</script>

<Button
  variant={variant}
  size={size}
  class={sidebarMenuAction({ "showOnHover": showOnHover, "class": cx(className) })}
  data-sidebar={"menu-action"}
  {...rest}
  data-slot={"sidebar-menu-action"}
>
  {@render children?.()}
</Button>
