<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableCell } from "./variants.js";

  export type TableCellProps = SvelteHTMLElements["td"] & { ref?: HTMLTableCellElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableCellProps = $props();
</script>

<td
  class={tableCell({ "class": cx(className) })}
  {...rest}
  data-slot={"table-cell"}
  bind:this={ref}
>
  {@render children?.()}
</td>
