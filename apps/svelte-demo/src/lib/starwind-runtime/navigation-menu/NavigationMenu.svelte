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
    defaultValue = null,
    openDelay = 50,
    closeDelay = 50,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    orientation = "horizontal",
    side = "bottom",
    align = "start",
    sideOffset = 8,
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    size = "md",
    contentSize = size,
    "class": className,
    portalContainer,
    disablePortal = false,
    value = $bindable(),
    onValueChange,
    "children": consumerChildren,
    "value": commandValue,
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
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render consumerChildren?.()}
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
</NavigationMenuRoot>
