<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarRail } from "@starwind-ui/svelte/sidebar";

  export type SidebarRailProps = ComponentProps<typeof SidebarRail> & {children?:Snippet;   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SidebarRailProps = $props();
</script>

<SidebarRail
  class={sidebarRail({ "class": cx(className) })}
  data-sidebar={"rail"}
  aria-label={"Toggle Sidebar"}
  {...rest}
  data-slot={"sidebar-rail"}
>

</SidebarRail>
