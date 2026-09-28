<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import type { SvelteHTMLElements } from "svelte/elements";
  import { Skeleton } from "../skeleton/index.js";

  export type SidebarMenuSkeletonProps = SvelteHTMLElements["div"] & {children?:Snippet; "showIcon"?:boolean; "width"?:string;  ref?:HTMLDivElement;};
</script>

<script lang="ts">
  let {
    "showIcon": showIcon = false,
    "width": width,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarMenuSkeletonProps = $props();

  let skeletonWidth = $derived(width ?? "70%");

  let skeletonStyle = $derived(`--skeleton-width: ${skeletonWidth}`);
</script>

<div
  class={sidebarMenuSkeleton({ "class": cx(className) })}
  data-sidebar={"menu-skeleton"}
  {...rest}
  data-slot={"sidebar-menu-skeleton"}
  bind:this={ref}
>
  {#if showIcon}
    <Skeleton
      class={"size-4 rounded-md"}
      data-sidebar={"menu-skeleton-icon"}
    >

    </Skeleton>
  {/if}
  <Skeleton
    class={"h-4 max-w-(--skeleton-width) flex-1"}
    style={skeletonStyle}
    data-sidebar={"menu-skeleton-text"}
  >

  </Skeleton>
</div>
