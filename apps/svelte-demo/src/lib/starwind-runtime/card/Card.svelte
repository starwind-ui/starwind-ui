<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { card } from "./variants.js";

  export type CardProps = SvelteHTMLElements["div"] & VariantProps<typeof card> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "size": size = "md",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardProps = $props();
</script>

<div
  data-sw-card
  class={card({ "size": size, "class": cx(className) })}
  {...rest}
  data-size={size}
  data-slot={"card"}
  bind:this={ref}
>
  {@render children?.()}
</div>
