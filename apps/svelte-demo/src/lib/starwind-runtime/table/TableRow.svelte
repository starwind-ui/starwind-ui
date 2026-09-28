<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableRow } from "./variants.js";

  export type TableRowProps = SvelteHTMLElements["tr"] & { ref?: HTMLTableRowElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableRowProps = $props();
</script>

<tr
  class={tableRow({ "class": cx(className) })}
  {...rest}
  data-slot={"table-row"}
  bind:this={ref}
>
  {@render children?.()}
</tr>
