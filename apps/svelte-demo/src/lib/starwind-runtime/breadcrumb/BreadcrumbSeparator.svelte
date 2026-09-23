<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { breadcrumbSeparator } from "./variants.js";

  export type BreadcrumbSeparatorProps = SvelteHTMLElements["li"] & { ref?: HTMLLIElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbSeparatorProps = $props();
</script>

<li
  data-sw-breadcrumb-separator
  role={"presentation"}
  aria-hidden={"true"}
  class={breadcrumbSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"breadcrumb-separator"}
  bind:this={ref}
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
      d={"M9 6l6 6l-6 6"}
    />
  </svg>{/if}
</li>
