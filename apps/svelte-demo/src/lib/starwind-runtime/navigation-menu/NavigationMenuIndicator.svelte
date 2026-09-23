<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NavigationMenuIcon } from "@starwind-ui/svelte/navigation-menu";
  import { cx } from "tailwind-variants";
  import { navigationMenu, navigationMenuList, navigationMenuItem, navigationMenuTrigger, navigationMenuIndicator, navigationMenuContent, navigationMenuLink, navigationMenuPositioner, navigationMenuPopup, navigationMenuViewport } from "./variants.js";

  export type NavigationMenuIndicatorProps = ComponentProps<typeof NavigationMenuIcon> & {  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: NavigationMenuIndicatorProps = $props();
</script>

<NavigationMenuIcon
  class={navigationMenuIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"navigation-menu-indicator"}
>
  {#if children}{@render children()}{:else}<svg
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
