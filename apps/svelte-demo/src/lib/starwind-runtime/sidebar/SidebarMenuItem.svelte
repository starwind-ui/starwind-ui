<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarMenuItemProps = SvelteHTMLElements["li"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLLIElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-menu-item",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarMenuItemProps = $props();
</script>

<li
  class={sidebarMenuItem({ "class": cx(className) })}
  data-sidebar={"menu-item"}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</li>
