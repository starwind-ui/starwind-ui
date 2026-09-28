<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { alertDescription } from "./variants.js";

  export type AlertDescriptionProps = SvelteHTMLElements["p"] & { ref?: HTMLParagraphElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AlertDescriptionProps = $props();
</script>

<p
  data-sw-alert-description
  class={alertDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-description"}
  bind:this={ref}
>
  {@render children?.()}
</p>
