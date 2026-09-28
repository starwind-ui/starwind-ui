<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableBody } from "./variants.js";

  export type TableBodyProps = SvelteHTMLElements["tbody"] & { ref?: HTMLTableSectionElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableBodyProps = $props();
</script>

<tbody
  class={tableBody({ "class": cx(className) })}
  {...rest}
  data-slot={"table-body"}
  bind:this={ref}
>
  {@render children?.()}
</tbody>
