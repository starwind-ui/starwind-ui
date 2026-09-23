<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableHead } from "./variants.js";

  export type TableHeadProps = SvelteHTMLElements["th"] & { ref?: HTMLTableCellElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableHeadProps = $props();
</script>

<th
  class={tableHead({ "class": cx(className) })}
  {...rest}
  data-slot={"table-head"}
  bind:this={ref}
>
  {@render children?.()}
</th>
