<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { Separator } from "../separator/index.js";

  export type SidebarSeparatorProps = ComponentProps<typeof Separator> & {children?:Snippet;   };
</script>

<script lang="ts">
  let {
    "orientation": orientation = "horizontal",
    "class": className,
    "children": children,
    ...rest
  }: SidebarSeparatorProps = $props();
</script>

<Separator
  orientation={orientation}
  class={sidebarSeparator({ "class": cx(className) })}
  data-sidebar={"separator"}
  {...rest}
  data-slot={"sidebar-separator"}
>

</Separator>
