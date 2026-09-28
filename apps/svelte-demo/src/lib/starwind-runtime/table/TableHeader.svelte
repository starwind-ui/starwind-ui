<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { tableHeader } from "./variants.js";

  export type TableHeaderProps = SvelteHTMLElements["thead"] & { ref?: HTMLTableSectionElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: TableHeaderProps = $props();
</script>

<thead
  class={tableHeader({ "class": cx(className) })}
  {...rest}
  data-slot={"table-header"}
  bind:this={ref}
>
  {@render children?.()}
</thead>
