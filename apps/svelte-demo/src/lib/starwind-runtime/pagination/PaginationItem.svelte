<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import {  } from "./variants.js";

  export type PaginationItemProps = SvelteHTMLElements["li"] & { ref?: HTMLLIElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: PaginationItemProps = $props();
</script>

<li
  class={className}
  {...rest}
  data-slot={"pagination-item"}
  bind:this={ref}
>
  {@render children?.()}
</li>
