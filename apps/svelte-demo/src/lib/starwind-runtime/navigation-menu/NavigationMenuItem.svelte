<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuItem } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";

  export type NavigationMenuItemProps = ComponentProps<typeof NavigationMenuItem> & {  };
</script>

<script lang="ts">
  let {
    "value": value,
    "class": className,
    "children": children,
    ...rest
  }: NavigationMenuItemProps = $props();
</script>

<NavigationMenuItem
  class={navigationMenuItem({ "class": cx(className) })}
  value={value}
  {...rest}
  data-slot={"navigation-menu-item"}
>
  {@render children?.()}
</NavigationMenuItem>
