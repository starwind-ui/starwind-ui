<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { buttonGroup } from "./variants.js";

  export type ButtonGroupProps = SvelteHTMLElements["div"] & VariantProps<typeof buttonGroup> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "orientation": orientation = "horizontal",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ButtonGroupProps = $props();
</script>

<div
  role={"group"}
  data-orientation={orientation}
  class={buttonGroup({ "orientation": orientation, "class": cx(className) })}
  {...rest}
  data-slot={"button-group"}
  bind:this={ref}
>
  {@render children?.()}
</div>
