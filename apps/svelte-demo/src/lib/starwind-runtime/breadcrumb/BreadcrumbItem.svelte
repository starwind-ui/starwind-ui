<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { breadcrumbItem } from "./variants.js";

  export type BreadcrumbItemProps = SvelteHTMLElements["li"] & { ref?: HTMLLIElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbItemProps = $props();
</script>

<li
  data-sw-breadcrumb-item
  class={breadcrumbItem({ "class": cx(className) })}
  {...rest}
  data-slot={"breadcrumb-item"}
  bind:this={ref}
>
  {@render children?.()}
</li>
