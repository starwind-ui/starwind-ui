<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarTrigger } from "@starwind-ui/svelte/sidebar";
  import { button } from "../button/variants.js";

  export type SidebarTriggerProps = ComponentProps<typeof SidebarTrigger> & VariantProps<typeof button> & {children?:Snippet;  icon?:Snippet; };
</script>

<script lang="ts">
  let {
    "size": size = "icon-sm",
    "variant": variant = "ghost",
    "class": className,
    "icon": icon,
    "children": children,
    ...rest
  }: SidebarTriggerProps = $props();
</script>

<SidebarTrigger
  class={[button({variant,size}), sidebarTrigger({ "class": cx(className) })].filter(Boolean).join(" ")}
  data-sidebar={"trigger"}
  aria-label={"Toggle Sidebar"}
  {...rest}
  data-slot={"sidebar-trigger"}
>
  {#if icon}{@render icon()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M4 4m-2 0a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z"}
    />
    <path
      d={"M9 4l0 16"}
    />
  </svg>{/if}
  <span
    class={"sr-only"}
  >
    Toggle Sidebar
  </span>
</SidebarTrigger>
