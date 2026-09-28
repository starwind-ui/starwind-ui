<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuPositioner, NavigationMenuPortal } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";
  import { NavigationMenuPopup } from "@starwind-ui/svelte/navigation-menu";
  import { NavigationMenuViewport } from "@starwind-ui/svelte/navigation-menu";

  export type NavigationMenuPositionerProps = ComponentProps<typeof NavigationMenuPositioner> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; alignOffset?: number; avoidCollisions?: boolean; collisionPadding?: number; size?: "sm" | "md"; disablePortal?: boolean; portalContainer?: ComponentProps<typeof NavigationMenuPortal>["container"]; };
</script>

<script lang="ts">
  let {
    "side": side = "bottom",
    "align": align = "start",
    "sideOffset": sideOffset = 8,
    "alignOffset": alignOffset = 0,
    "avoidCollisions": avoidCollisions = true,
    "collisionPadding": collisionPadding = 8,
    "size": size = "md",
    "class": className,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: NavigationMenuPositionerProps = $props();
</script>

<NavigationMenuPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"navigation-menu-portal"}
>
  <NavigationMenuPositioner
    class={navigationMenuPositioner({ "class": cx(className) })}
    side={side}
    align={align}
    sideOffset={sideOffset}
    alignOffset={alignOffset}
    avoidCollisions={avoidCollisions}
    collisionPadding={collisionPadding}
    {...rest}
    data-size={size}
    data-slot={"navigation-menu-positioner"}
  >
    <NavigationMenuPopup
      class={navigationMenuPopup({  })}
      data-slot={"navigation-menu-popup"}
    >
      <NavigationMenuViewport
        class={navigationMenuViewport({  })}
        data-slot={"navigation-menu-viewport"}
      >

      </NavigationMenuViewport>
    </NavigationMenuPopup>
  </NavigationMenuPositioner>
</NavigationMenuPortal>
