<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { skeleton } from "./variants.js";

  export type SkeletonProps = Omit<SvelteHTMLElements["div"], "children"> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    ...rest
  }: SkeletonProps = $props();

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["children"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

<div
  data-sw-skeleton
  class={skeleton({ "class": cx(className) })}
  {...nativeProps}
  data-slot={"skeleton"}
  bind:this={ref}
>

</div>
