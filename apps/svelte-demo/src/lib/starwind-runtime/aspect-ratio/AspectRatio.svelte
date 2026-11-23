<script module lang="ts">
  import type { HTMLAttributes, SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { aspectRatio } from "./variants.js";

  export type AspectRatioProps<T extends keyof HTMLElementTagNameMap = "div"> = SvelteHTMLElements[T] & VariantProps<typeof aspectRatio> & { as?: T; ref?: HTMLElement; "ratio"?: number; };
</script>

<script lang="ts" generics="T extends keyof HTMLElementTagNameMap = 'div'">
  let {
    ratio = 1,
    as,
    "class": className,
    style,
    ref = $bindable(),
    children,
    ...rest
  }: AspectRatioProps<T> = $props();

  let ratioStyle = $derived(`--ratio: ${ratio}; ${style ?? ""}`);

  let Tag: keyof HTMLElementTagNameMap = $derived(as ?? "div");

  const nativeProps = () => rest as HTMLAttributes<HTMLElement>;

  let nativeIsVoid = $derived(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(Tag));
</script>

{#if nativeIsVoid}
  <svelte:element
    this={Tag}
    {...nativeProps()}
    class={aspectRatio({ "class": cx(className) })}
    style={ratioStyle}
    data-slot={"aspect-ratio"}
    bind:this={ref}
  />
{:else}
  <svelte:element
    this={Tag}
    {...nativeProps()}
    class={aspectRatio({ "class": cx(className) })}
    style={ratioStyle}
    data-slot={"aspect-ratio"}
    bind:this={ref}
  >
    {@render children?.()}
  </svelte:element>
{/if}
