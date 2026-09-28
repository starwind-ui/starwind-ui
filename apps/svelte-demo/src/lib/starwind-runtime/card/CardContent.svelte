<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardContent } from "./variants.js";

  export type CardContentProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardContentProps = $props();
</script>

<div
  data-sw-card-content
  class={cardContent({ "class": cx(className) })}
  {...rest}
  data-slot={"card-content"}
  bind:this={ref}
>
  {@render children?.()}
</div>
