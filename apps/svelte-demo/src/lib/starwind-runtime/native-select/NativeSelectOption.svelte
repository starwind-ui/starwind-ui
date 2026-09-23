<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import {  } from "./variants.js";

  export type NativeSelectOptionProps = SvelteHTMLElements["option"] & { ref?: HTMLOptionElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: NativeSelectOptionProps = $props();
</script>

<option
  class={["bg-[Canvas] text-[CanvasText]", cx(className)].filter(Boolean).join(" ")}
  {...rest}
  data-slot={"native-select-option"}
  bind:this={ref}
>
  {@render children?.()}
</option>
