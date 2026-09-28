<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemFooter } from "./variants.js";

  export type ItemFooterProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemFooterProps = $props();
</script>

<div
  class={itemFooter({ "class": cx(className) })}
  {...rest}
  data-slot={"item-footer"}
  bind:this={ref}
>
  {@render children?.()}
</div>
