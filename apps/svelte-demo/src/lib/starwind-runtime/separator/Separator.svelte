<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { separator } from "./variants.js";

  export type SeparatorProps = Omit<SvelteHTMLElements["div"], "role" | "aria-orientation"> & VariantProps<typeof separator> & { ref?: HTMLDivElement; "data-slot"?: string; };
</script>

<script lang="ts">
  let {
    "orientation": orientation = "horizontal",
    "data-slot": dataSlot = "separator",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SeparatorProps = $props();

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["role","aria-orientation"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

<div
  data-sw-separator
  role={"separator"}
  aria-orientation={orientation}
  data-orientation={orientation}
  class={separator({ "orientation": orientation, "class": cx(className) })}
  {...nativeProps}
  data-slot={dataSlot}
  bind:this={ref}
>

</div>
