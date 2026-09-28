<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardHeader } from "./variants.js";

  export type CardHeaderProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardHeaderProps = $props();
</script>

<div
  data-sw-card-header
  class={cardHeader({ "class": cx(className) })}
  {...rest}
  data-slot={"card-header"}
  bind:this={ref}
>
  {@render children?.()}
</div>
