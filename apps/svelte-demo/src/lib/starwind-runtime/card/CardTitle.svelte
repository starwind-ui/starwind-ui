<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardTitle } from "./variants.js";

  export type CardTitleProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardTitleProps = $props();
</script>

<div
  data-sw-card-title
  class={cardTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"card-title"}
  bind:this={ref}
>
  {@render children?.()}
</div>
