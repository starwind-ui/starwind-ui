<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { aspectRatio, aspectRatioWrapper } from "./variants.js";

  export type AspectRatioProps = SvelteHTMLElements["div"] & VariantProps<typeof aspectRatio> & { as?: keyof HTMLElementTagNameMap; ref?: HTMLElement; "ratio"?: number; };
</script>

<script lang="ts">
  let {
    "ratio": ratio = 1,
    "as": Tag = "div",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AspectRatioProps = $props();

  let wrapperStyle = $derived(`padding-bottom: ${100 / ratio}%`);

  let nativeIsVoid = $derived(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(Tag));
</script>

<div
  class={aspectRatioWrapper({  })}
  style={wrapperStyle}
  data-slot={"aspect-ratio-wrapper"}
>
  {#if nativeIsVoid}
    <svelte:element
      this={Tag}
      class={aspectRatio({ "class": cx(className) })}
      data-slot={"aspect-ratio"}
      {...rest}
      bind:this={ref}
    />
  {:else}
    <svelte:element
      this={Tag}
      class={aspectRatio({ "class": cx(className) })}
      data-slot={"aspect-ratio"}
      {...rest}
      bind:this={ref}
    >
      {@render children?.()}
    </svelte:element>
  {/if}
</div>
