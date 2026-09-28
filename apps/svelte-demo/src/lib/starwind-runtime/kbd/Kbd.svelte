<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { kbd } from "./variants.js";

  export type KbdProps = SvelteHTMLElements["kbd"] & { ref?: HTMLElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: KbdProps = $props();
</script>

<kbd
  data-sw-kbd
  class={kbd({ "class": cx(className) })}
  {...rest}
  data-slot={"kbd"}
  bind:this={ref}
>
  {@render children?.()}
</kbd>
