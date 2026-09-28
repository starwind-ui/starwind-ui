<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuContent } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";

  export type NavigationMenuContentProps = ComponentProps<typeof NavigationMenuContent> & {  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: NavigationMenuContentProps = $props();
</script>

<NavigationMenuContent
  class={navigationMenuContent({ "class": cx(className) })}
  {...rest}
  data-slot={"navigation-menu-content"}
>
  {@render children?.()}
</NavigationMenuContent>
