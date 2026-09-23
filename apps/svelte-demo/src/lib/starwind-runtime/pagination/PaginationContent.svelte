<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { paginationContent } from "./variants.js";

  export type PaginationContentProps = SvelteHTMLElements["ul"] & { ref?: HTMLUListElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: PaginationContentProps = $props();
</script>

<ul
  class={paginationContent({ "class": cx(className) })}
  {...rest}
  data-slot={"pagination-content"}
  bind:this={ref}
>
  {@render children?.()}
</ul>
