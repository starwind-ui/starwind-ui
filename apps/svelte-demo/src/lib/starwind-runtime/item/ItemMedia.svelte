<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { itemMedia } from "./variants.js";

  export type ItemMediaProps = SvelteHTMLElements["div"] & VariantProps<typeof itemMedia> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemMediaProps = $props();
</script>

<div
  class={itemMedia({ "variant": variant, "class": cx(className) })}
  data-variant={variant}
  {...rest}
  data-slot={"item-media"}
  bind:this={ref}
>
  {@render children?.()}
</div>
