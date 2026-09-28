<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { spinner } from "./variants.js";

  export type SpinnerProps = Omit<SvelteHTMLElements["svg"], "role" | "aria-label" | "mode" | "children"> & { [key: symbol]: unknown; ref?: SVGSVGElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    ...rest
  }: SpinnerProps = $props();

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["role","aria-label","mode","children"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

<svg
  xmlns={"http://www.w3.org/2000/svg"}
  viewBox={"0 0 24 24"}
  fill={"none"}
  stroke={"currentColor"}
  stroke-width={"2"}
  stroke-linecap={"round"}
  stroke-linejoin={"round"}
  aria-hidden={"true"}
  role={"status"}
  aria-label={"Loading"}
  class={spinner({ "class": cx(className) })}
  {...nativeProps}
  data-slot={"spinner"}
  bind:this={ref}
>
  <path
    stroke={"none"}
    d={"M0 0h24v24H0z"}
    fill={"none"}
  />
  <path
    d={"M12 3a9 9 0 1 0 9 9"}
  />
</svg>
