<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import {  } from "./variants.js";

  export type NativeSelectOptGroupProps = SvelteHTMLElements["optgroup"] & { ref?: HTMLOptGroupElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: NativeSelectOptGroupProps = $props();
</script>

<optgroup
  class={["bg-[Canvas] text-[CanvasText]", cx(className)].filter(Boolean).join(" ")}
  {...rest}
  data-slot={"native-select-optgroup"}
  bind:this={ref}
>
  {@render children?.()}
</optgroup>
