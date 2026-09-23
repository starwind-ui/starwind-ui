<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuRoot, NavigationMenuPortal } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";
  import { default as NavigationMenuPositioner } from "./NavigationMenuPositioner.svelte";

  export type NavigationMenuProps = ComponentProps<typeof NavigationMenuRoot> & { defaultValue?: string | null; openDelay?: number; closeDelay?: number; closeOnEscape?: boolean; closeOnOutsideInteract?: boolean; orientation?: "horizontal" | "vertical"; side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; alignOffset?: number; avoidCollisions?: boolean; collisionPadding?: number; size?: "sm" | "md"; disablePortal?: boolean; contentSize?: "sm" | "md"; portalContainer?: ComponentProps<typeof NavigationMenuPortal>["container"]; };
</script>

<script lang="ts">
  let {
    "defaultValue": defaultValue = null,
    "openDelay": openDelay = 50,
    "closeDelay": closeDelay = 50,
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = true,
    "orientation": orientation = "horizontal",
    "side": side = "bottom",
    "align": align = "start",
    "sideOffset": sideOffset = 8,
    "alignOffset": alignOffset = 0,
    "avoidCollisions": avoidCollisions = true,
    "collisionPadding": collisionPadding = 8,
    "size": size = "md",
    "contentSize": contentSize = size,
    "class": className,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    value = $bindable(),
    "onValueChange": onValueChange,
    "children": consumerChildren,
    ...rest
  }: NavigationMenuProps = $props();
</script>

<NavigationMenuRoot
  class={navigationMenu({ "class": cx(className) })}
  defaultValue={defaultValue}
  openDelay={openDelay}
  closeDelay={closeDelay}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  orientation={orientation}
  {...rest}
  data-size={size}
  data-slot={"navigation-menu"}
  onValueChange={onValueChange}
  bind:value={value}
>
  {#snippet children(acceptedValue)}
    {@render consumerChildren?.(acceptedValue)}
    <NavigationMenuPositioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      size={contentSize}
      portalContainer={portalContainer}
      disablePortal={disablePortal}
    >

    </NavigationMenuPositioner>
  {/snippet}
</NavigationMenuRoot>
