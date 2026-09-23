<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemDescription } from "./variants.js";

  export type ItemDescriptionProps = SvelteHTMLElements["p"] & { ref?: HTMLParagraphElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemDescriptionProps = $props();
</script>

<p
  class={itemDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"item-description"}
  bind:this={ref}
>
  {@render children?.()}
</p>
