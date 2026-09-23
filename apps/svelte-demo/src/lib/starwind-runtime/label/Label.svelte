<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { label } from "./variants.js";

  export type LabelProps = SvelteHTMLElements["label"] & VariantProps<typeof label> & { ref?: HTMLLabelElement;  };
</script>

<script lang="ts">
  let {
    "size": size,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: LabelProps = $props();
</script>

<label
  data-sw-label
  class={label({ "size": size, "class": cx(className) })}
  {...rest}
  data-slot={"label"}
  bind:this={ref}
>
  {@render children?.()}
</label>
