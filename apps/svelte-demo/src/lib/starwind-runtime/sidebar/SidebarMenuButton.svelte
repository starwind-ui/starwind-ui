<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarMenuButton } from "@starwind-ui/svelte/sidebar";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { ButtonChildProps, SidebarMenuButtonChildPayload } from "@starwind-ui/svelte/sidebar";
  import { Tooltip } from "../tooltip/index.js";
  import { TooltipContent } from "../tooltip/index.js";
  import "./styles.css";

  export type SidebarMenuButtonProps = ((ButtonChildProps & { href?: undefined; ref?: (element: HTMLButtonElement | null) => void }) | (Omit<HTMLAnchorAttributes, "children"> & { href: string; ref?: (element: HTMLAnchorElement | null) => void })) & { child?: Snippet<[SidebarMenuButtonChildPayload]> } & VariantProps<typeof sidebarMenuButton> & {children?:Snippet; "isActive"?:boolean; "tooltip"?:string;  };
</script>

<script lang="ts">
  let {
    "isActive": isActive = false,
    "tooltip": tooltip,
    "variant": variant,
    "size": size = "md",
    "href": href,
    "class": className,
    "child": child,
    "children": children,
    ...rest
  }: SidebarMenuButtonProps = $props();

  let Tag = $derived(href ? "a" : "button");

  let buttonClassName = $derived(sidebarMenuButton({ "variant": variant, "size": size, "class": cx(className) }));

  let menuProps = $derived(({ "class": buttonClassName, "data-sidebar": "menu-button", "data-size": size, "data-active": isActive, "data-tooltip": tooltip, "href": href, "data-slot": "sidebar-menu-button", ...rest, "data-sw-tooltip-trigger": tooltip ? "" : undefined }) as unknown as ComponentProps<typeof SidebarMenuButton>);
</script>

{#snippet nativeControl({ props, children: content }: SidebarMenuButtonChildPayload)}
  <svelte:element this={Tag} {...props} {...{ type: Tag === "button" ? "button" : undefined }}>{@render content?.()}</svelte:element>
{/snippet}
{#if Boolean(tooltip)}
  <Tooltip
    openDelay={0}
    closeDelay={0}
    class={"w-full"}
  >
    <SidebarMenuButton
      {...menuProps}
      child={child ?? nativeControl}
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
    child={child ?? nativeControl}
  >
    {@render children?.()}
  </SidebarMenuButton>
{/if}
