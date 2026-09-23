<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarGroupProps = SvelteHTMLElements["div"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLDivElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-group",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarGroupProps = $props();
</script>

<div
  class={sidebarGroup({ "class": cx(className) })}
  data-sidebar={"group"}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</div>
