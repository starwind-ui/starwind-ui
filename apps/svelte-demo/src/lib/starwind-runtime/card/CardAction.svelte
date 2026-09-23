<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { cardAction } from "./variants.js";

  export type CardActionProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: CardActionProps = $props();
</script>

<div
  data-sw-card-action
  class={cardAction({ "class": cx(className) })}
  {...rest}
  data-slot={"card-action"}
  bind:this={ref}
>
  {@render children?.()}
</div>
