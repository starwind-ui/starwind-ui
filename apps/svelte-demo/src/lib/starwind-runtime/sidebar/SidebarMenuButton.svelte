<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarMenuButton } from "@starwind-ui/svelte/sidebar";
  import { useSidebarContext } from "@starwind-ui/svelte/sidebar";
  import { Tooltip } from "../tooltip/index.js";
  import { TooltipContent } from "../tooltip/index.js";
  import "./styles.css";

  export type SidebarMenuButtonProps = ComponentProps<typeof SidebarMenuButton> & VariantProps<typeof sidebarMenuButton> & {children?:Snippet; "isActive"?:boolean; "tooltip"?:string;  };
</script>

<script lang="ts">
  let {
    "isActive": isActive = false,
    "tooltip": tooltip,
    "variant": variant,
    "size": size = "md",
    "href": href,
    "class": className,
    "children": children,
    ...rest
  }: SidebarMenuButtonProps = $props();

  let buttonClassName = $derived(sidebarMenuButton({ "variant": variant, "size": size, "class": cx(className) }));

  let menuProps = $derived(({ "class": buttonClassName, "data-sidebar": "menu-button", "data-size": size, "data-active": isActive, "data-tooltip": tooltip, "href": href, "data-slot": "sidebar-menu-button", ...rest, "data-sw-tooltip-trigger": tooltip ? "" : undefined }) as ComponentProps<typeof SidebarMenuButton>);

  const context = useSidebarContext();
</script>

{#if Boolean(tooltip)}
  <Tooltip
    openDelay={0}
    closeDelay={0}
    class={"w-full"}
    disabled={context.open || context.isMobile}
  >
    <SidebarMenuButton
      {...menuProps}
    >
      {@render children?.()}
    </SidebarMenuButton>
    <TooltipContent
      side={"right"}
      align={"center"}
      class={"whitespace-nowrap"}
      data-sw-sidebar-tooltip-content
    >
      {tooltip}
    </TooltipContent>
  </Tooltip>
{:else}
  <SidebarMenuButton
    {...menuProps}
  >
    {@render children?.()}
  </SidebarMenuButton>
{/if}
