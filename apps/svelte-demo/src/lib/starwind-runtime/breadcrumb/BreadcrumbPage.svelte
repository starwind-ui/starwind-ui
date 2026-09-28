<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { breadcrumbPage } from "./variants.js";

  export type BreadcrumbPageProps = SvelteHTMLElements["span"] & { ref?: HTMLSpanElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbPageProps = $props();
</script>

<span
  data-sw-breadcrumb-page
  role={"link"}
  aria-disabled={"true"}
  aria-current={"page"}
  class={breadcrumbPage({ "class": cx(className) })}
  {...rest}
  data-slot={"breadcrumb-page"}
  bind:this={ref}
>
  {@render children?.()}
</span>
