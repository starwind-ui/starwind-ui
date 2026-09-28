<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import {  } from "./variants.js";

  export type BreadcrumbProps = SvelteHTMLElements["nav"] & { ref?: HTMLElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbProps = $props();
</script>

<nav
  data-sw-breadcrumb
  aria-label={"breadcrumb"}
  class={className}
  {...rest}
  data-slot={"breadcrumb"}
  bind:this={ref}
>
  {@render children?.()}
</nav>
