<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuTrigger } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";
  import { NavigationMenuIcon } from "@starwind-ui/svelte/navigation-menu";

  export type NavigationMenuTriggerProps = ComponentProps<typeof NavigationMenuTrigger> & { disabled?: boolean; openDelay?: number; closeDelay?: number; showIcon?: boolean; iconClass?: string; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "openDelay": openDelay,
    "closeDelay": closeDelay,
    "showIcon": showIcon = true,
    "iconClass": iconClassName,
    "class": className,
    "child": child,
    "icon": icon,
    "children": children,
    ...rest
  }: NavigationMenuTriggerProps = $props();

  let triggerBaseClassName = $derived(navigationMenuTrigger({ "class": cx(className) }));

  let triggerClassName = $derived(child ? className : triggerBaseClassName);
</script>

{#if child}
  <NavigationMenuTrigger
    class={triggerClassName}
    child={child}
    disabled={disabled}
    openDelay={openDelay}
    closeDelay={closeDelay}
    {...rest}
    data-slot={"navigation-menu-trigger"}
  >
    {@render children?.()}
  </NavigationMenuTrigger>
{:else}
  <NavigationMenuTrigger
    class={triggerClassName}
    child={child}
    disabled={disabled}
    openDelay={openDelay}
    closeDelay={closeDelay}
    {...rest}
    data-slot={"navigation-menu-trigger"}
  >
    {@render children?.()}
    {#if showIcon}
      <NavigationMenuIcon
        class={navigationMenuIndicator({ "class": cx(iconClassName) })}
        data-slot={"navigation-menu-indicator"}
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
            d={"M6 9l6 6l6 -6"}
          />
        </svg>{/if}
      </NavigationMenuIcon>
    {/if}
  </NavigationMenuTrigger>
{/if}
