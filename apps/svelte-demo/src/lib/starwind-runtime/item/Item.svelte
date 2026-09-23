<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { item } from "./variants.js";

  export type ItemProps = SvelteHTMLElements["div"] & Omit<SvelteHTMLElements["a"], "type"> & VariantProps<typeof item> & { as?: keyof HTMLElementTagNameMap; ref?: HTMLElement;  };
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "size": size = "md",
    "as": Tag = "div",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: ItemProps = $props();

  let nativeIsVoid = $derived(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(Tag));

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["type"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

{#if nativeIsVoid}
  <svelte:element
    this={Tag}
    data-sw-item
    class={item({ "variant": variant, "size": size, "class": cx(className) })}
    {...nativeProps}
    data-slot={"item"}
    bind:this={ref}
  />
{:else}
  <svelte:element
    this={Tag}
    data-sw-item
    class={item({ "variant": variant, "size": size, "class": cx(className) })}
    {...nativeProps}
    data-slot={"item"}
    bind:this={ref}
  >
    {@render children?.()}
  </svelte:element>
{/if}
