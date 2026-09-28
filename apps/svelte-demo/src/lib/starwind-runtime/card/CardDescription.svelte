<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardDescription } from "./variants.js";

  export type CardDescriptionProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardDescriptionProps = $props();
</script>

<div
  data-sw-card-description
  class={cardDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"card-description"}
  bind:this={ref}
>
  {@render children?.()}
</div>
