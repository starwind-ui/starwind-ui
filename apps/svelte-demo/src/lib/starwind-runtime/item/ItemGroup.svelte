<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemGroup } from "./variants.js";

  export type ItemGroupProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemGroupProps = $props();
</script>

<div
  role={"list"}
  class={itemGroup({ "class": cx(className) })}
  {...rest}
  data-slot={"item-group"}
  bind:this={ref}
>
  {@render children?.()}
</div>
