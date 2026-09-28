<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableCaption } from "./variants.js";

  export type TableCaptionProps = SvelteHTMLElements["caption"] & { ref?: HTMLTableCaptionElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableCaptionProps = $props();
</script>

<caption
  class={tableCaption({ "class": cx(className) })}
  {...rest}
  data-slot={"table-caption"}
  bind:this={ref}
>
  {@render children?.()}
</caption>
