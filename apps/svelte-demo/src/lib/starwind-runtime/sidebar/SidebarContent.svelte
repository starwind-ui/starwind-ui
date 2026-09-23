<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarContentProps = SvelteHTMLElements["div"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLDivElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-content",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarContentProps = $props();
</script>

<div
  class={sidebarContent({ "class": cx(className) })}
  data-sidebar={"content"}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</div>
