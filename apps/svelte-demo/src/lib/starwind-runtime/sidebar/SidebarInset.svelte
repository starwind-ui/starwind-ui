<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarInsetProps = SvelteHTMLElements["main"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-inset",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarInsetProps = $props();
</script>

<main
  class={sidebarInset({ "class": cx(className) })}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</main>
