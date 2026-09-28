<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { kbdGroup } from "./variants.js";

  export type KbdGroupProps = SvelteHTMLElements["kbd"] & { ref?: HTMLElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: KbdGroupProps = $props();
</script>

<kbd
  data-sw-kbd-group
  class={kbdGroup({ "class": cx(className) })}
  {...rest}
  data-slot={"kbd-group"}
  bind:this={ref}
>
  {@render children?.()}
</kbd>
