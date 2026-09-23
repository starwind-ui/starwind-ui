<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarHeaderProps = SvelteHTMLElements["div"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLDivElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-header",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarHeaderProps = $props();
</script>

<div
  class={sidebarHeader({ "class": cx(className) })}
  data-sidebar={"header"}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</div>
