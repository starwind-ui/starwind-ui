<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { Button } from "../button/index.js";

  export type SidebarGroupActionProps = ComponentProps<typeof Button> & {children?:Snippet;   };
</script>

<script lang="ts">
  let {
    "variant": variant = "ghost",
    "size": size = "icon-sm",
    "class": className,
    "children": children,
    ...rest
  }: SidebarGroupActionProps = $props();
</script>

<Button
  variant={variant}
  size={size}
  class={sidebarGroupAction({ "class": cx(className) })}
  data-sidebar={"group-action"}
  {...rest}
  data-slot={"sidebar-group-action"}
>
  {@render children?.()}
</Button>
