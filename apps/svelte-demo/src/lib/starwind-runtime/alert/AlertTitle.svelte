<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { alertTitle } from "./variants.js";

  export type AlertTitleProps = SvelteHTMLElements["h5"] & { ref?: HTMLHeadingElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AlertTitleProps = $props();
</script>

<h5
  data-sw-alert-title
  class={alertTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-title"}
  bind:this={ref}
>
  {@render children?.()}
</h5>
