<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { pagination } from "./variants.js";

  export type PaginationProps = SvelteHTMLElements["nav"] & { ref?: HTMLElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: PaginationProps = $props();
</script>

<nav
  role={"navigation"}
  aria-label={"pagination"}
  class={pagination({ "class": cx(className) })}
  {...rest}
  data-slot={"pagination"}
  bind:this={ref}
>
  {@render children?.()}
</nav>
