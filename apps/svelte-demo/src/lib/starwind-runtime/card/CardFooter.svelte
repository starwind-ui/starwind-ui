<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardFooter } from "./variants.js";

  export type CardFooterProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardFooterProps = $props();
</script>

<div
  data-sw-card-footer
  class={cardFooter({ "class": cx(className) })}
  {...rest}
  data-slot={"card-footer"}
  bind:this={ref}
>
  {@render children?.()}
</div>
