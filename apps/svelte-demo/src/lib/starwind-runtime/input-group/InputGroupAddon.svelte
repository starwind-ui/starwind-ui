<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { inputGroupAddon } from "./variants.js";

  export type InputGroupAddonProps = SvelteHTMLElements["div"] & VariantProps<typeof inputGroupAddon> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "align": align,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: InputGroupAddonProps = $props();
</script>

<div
  role={"group"}
  data-align={align}
  class={inputGroupAddon({ "align": align, "class": cx(className) })}
  {...rest}
  data-slot={"input-group-addon"}
  bind:this={ref}
>
  {@render children?.()}
</div>
