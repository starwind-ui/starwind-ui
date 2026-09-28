<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { inputGroup } from "./variants.js";

  export type InputGroupProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: InputGroupProps = $props();
</script>

<div
  role={"group"}
  class={inputGroup({ "class": cx(className) })}
  data-slot={"input-group"}
  {...rest}
  bind:this={ref}
>
  {@render children?.()}
</div>
