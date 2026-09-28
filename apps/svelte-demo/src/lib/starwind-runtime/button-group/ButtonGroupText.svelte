<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { buttonGroupText } from "./variants.js";

  export type ButtonGroupTextProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ButtonGroupTextProps = $props();
</script>

<div
  class={buttonGroupText({ "class": cx(className) })}
  {...rest}
  data-slot={"button-group-text"}
  bind:this={ref}
>
  {@render children?.()}
</div>
