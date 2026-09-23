<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemHeader } from "./variants.js";

  export type ItemHeaderProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemHeaderProps = $props();
</script>

<div
  class={itemHeader({ "class": cx(className) })}
  {...rest}
  data-slot={"item-header"}
  bind:this={ref}
>
  {@render children?.()}
</div>
