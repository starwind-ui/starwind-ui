<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuLink } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";

  export type NavigationMenuLinkProps = ComponentProps<typeof NavigationMenuLink> & { active?: boolean; closeOnClick?: boolean; };
</script>

<script lang="ts">
  let {
    "active": active = false,
    "closeOnClick": closeOnClick = true,
    "class": className,
    "children": children,
    ...rest
  }: NavigationMenuLinkProps = $props();
</script>

<NavigationMenuLink
  class={navigationMenuLink({ "class": cx(className) })}
  active={active}
  closeOnClick={closeOnClick}
  {...rest}
  data-slot={"navigation-menu-link"}
>
  {@render children?.()}
</NavigationMenuLink>
