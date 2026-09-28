<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemActions } from "./variants.js";

  export type ItemActionsProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemActionsProps = $props();
</script>

<div
  class={itemActions({ "class": cx(className) })}
  {...rest}
  data-slot={"item-actions"}
  bind:this={ref}
>
  {@render children?.()}
</div>
