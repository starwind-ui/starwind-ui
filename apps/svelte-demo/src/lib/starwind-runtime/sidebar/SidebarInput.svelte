<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { Input } from "../input/index.js";

  export type SidebarInputProps = ComponentProps<typeof Input> & {children?:Snippet;   };
</script>

<script lang="ts">
  let {
    "size": size = "md",
    "class": className,
    value = $bindable(),
    "children": children,
    ...rest
  }: SidebarInputProps = $props();
</script>

<Input
  size={size}
  class={sidebarInput({ "class": cx(className) })}
  data-sidebar={"input"}
  {...rest}
  data-slot={"sidebar-input"}
  bind:value={value}
>

</Input>
