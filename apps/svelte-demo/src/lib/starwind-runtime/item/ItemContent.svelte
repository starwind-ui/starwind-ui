<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemContent } from "./variants.js";

  export type ItemContentProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemContentProps = $props();
</script>

<div
  class={itemContent({ "class": cx(className) })}
  {...rest}
  data-slot={"item-content"}
  bind:this={ref}
>
  {@render children?.()}
</div>
