<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuList } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";

  export type NavigationMenuListProps = ComponentProps<typeof NavigationMenuList> & {  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: NavigationMenuListProps = $props();
</script>

<NavigationMenuList
  class={navigationMenuList({ "class": cx(className) })}
  {...rest}
  data-slot={"navigation-menu-list"}
>
  {@render children?.()}
</NavigationMenuList>
