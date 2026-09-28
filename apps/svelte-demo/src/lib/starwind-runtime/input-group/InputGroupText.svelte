<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { inputGroupText } from "./variants.js";

  export type InputGroupTextProps = SvelteHTMLElements["span"] & { ref?: HTMLSpanElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: InputGroupTextProps = $props();
</script>

<span
  class={inputGroupText({ "class": cx(className) })}
  {...rest}
  bind:this={ref}
>
  {@render children?.()}
</span>
