<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { prose } from "./variants.js";
  import "./styles.css";

  export type ProseProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ProseProps = $props();
</script>

<div
  data-sw-prose
  class={prose({ "class": cx(className) })}
  {...rest}
  data-slot={"prose"}
  bind:this={ref}
>
  {@render children?.()}
</div>
