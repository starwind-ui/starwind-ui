<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarMenuSubProps = SvelteHTMLElements["ul"] & {children?:Snippet; "data-slot"?:string;  ref?:HTMLUListElement;};
</script>

<script lang="ts">
  let {
    "data-slot": dataSlot = "sidebar-menu-sub",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarMenuSubProps = $props();
</script>

<ul
  class={sidebarMenuSub({ "class": cx(className) })}
  data-sidebar={"menu-sub"}
  {...rest}
  data-slot={dataSlot}
  bind:this={ref}
>
  {@render children?.()}
</ul>
