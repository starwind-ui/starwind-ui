<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { breadcrumbList } from "./variants.js";

  export type BreadcrumbListProps = SvelteHTMLElements["ol"] & { ref?: HTMLOListElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbListProps = $props();
</script>

<ol
  data-sw-breadcrumb-list
  class={breadcrumbList({ "class": cx(className) })}
  {...rest}
  data-slot={"breadcrumb-list"}
  bind:this={ref}
>
  {@render children?.()}
</ol>
