<script module lang="ts">
  import type { Snippet } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { breadcrumbEllipsis } from "./variants.js";

  export type BreadcrumbEllipsisProps = SvelteHTMLElements["span"] & { ref?: HTMLSpanElement;  icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "icon": icon,
    "children": children,
    ...rest
  }: BreadcrumbEllipsisProps = $props();
</script>

<span
  data-sw-breadcrumb-ellipsis
  role={"presentation"}
  aria-hidden={"true"}
  class={breadcrumbEllipsis({ "class": cx(className) })}
  {...rest}
  data-slot={"breadcrumb-ellipsis"}
  bind:this={ref}
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
      d={"M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"}
    />
    <path
      d={"M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"}
    />
    <path
      d={"M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"}
    />
  </svg>{/if}
  {#if children}{@render children()}{:else}<span
    class={"sr-only"}
  >
    More
  </span>{/if}
</span>
