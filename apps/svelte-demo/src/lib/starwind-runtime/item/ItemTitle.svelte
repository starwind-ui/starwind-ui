<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemTitle } from "./variants.js";

  export type ItemTitleProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemTitleProps = $props();
</script>

<div
  class={itemTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"item-title"}
  bind:this={ref}
>
  {@render children?.()}
</div>
