<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableFoot } from "./variants.js";

  export type TableFootProps = SvelteHTMLElements["tfoot"] & { ref?: HTMLTableSectionElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableFootProps = $props();
</script>

<tfoot
  class={tableFoot({ "class": cx(className) })}
  {...rest}
  data-slot={"table-foot"}
  bind:this={ref}
>
  {@render children?.()}
</tfoot>
