<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";

  export type SidebarMenuSubButtonProps = SvelteHTMLElements["a"] & VariantProps<typeof sidebarMenuSubButton> & {children?:Snippet; "isActive"?:boolean;  ref?:HTMLAnchorElement;};
</script>

<script lang="ts">
  let {
    "size": size = "md",
    "isActive": isActive = false,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarMenuSubButtonProps = $props();
</script>

<a
  class={sidebarMenuSubButton({ "size": size, "class": cx(className) })}
  data-sidebar={"menu-sub-button"}
  data-size={size}
  data-active={isActive}
  {...rest}
  data-slot={"sidebar-menu-sub-button"}
  bind:this={ref}
>
  {@render children?.()}
</a>
