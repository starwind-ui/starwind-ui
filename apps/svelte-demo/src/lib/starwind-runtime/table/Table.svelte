<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { table } from "./variants.js";

  export type TableProps = SvelteHTMLElements["table"] & VariantProps<typeof table> & { ref?: HTMLTableElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableProps = $props();
</script>

<div
  data-slot={"table-container"}
  class={"relative w-full overflow-x-auto"}
>
  <table
    class={table({ "class": cx(className) })}
    {...rest}
    data-slot={"table"}
    bind:this={ref}
  >
    {@render children?.()}
  </table>
</div>
