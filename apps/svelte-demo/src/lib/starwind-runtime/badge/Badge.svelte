<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { badge } from "./variants.js";

  export type BadgeProps = SvelteHTMLElements["div"] & Omit<SvelteHTMLElements["a"], "type"> & Omit<VariantProps<typeof badge>, "isLink"> & { ref?: HTMLDivElement | HTMLAnchorElement;  };
</script>

<script lang="ts">
  let {
    "variant": variant,
    "tone": tone,
    "appearance": appearance,
    "eyebrow": eyebrow,
    "size": size,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BadgeProps = $props();

  let usesComposedBadgeStyle = $derived(tone !== undefined || appearance !== undefined);

  let resolvedVariant = $derived((usesComposedBadgeStyle ? null : variant) as typeof variant);

  let resolvedTone = $derived(usesComposedBadgeStyle ? (tone ?? "neutral") : undefined);

  let resolvedAppearance = $derived(usesComposedBadgeStyle ? (appearance ?? "soft") : undefined);

  let Tag = $derived(rest.href ? "a" : "div");

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
    data-sw-badge
    class={badge({ "variant": resolvedVariant, "tone": resolvedTone, "appearance": resolvedAppearance, "eyebrow": eyebrow, "size": size, "isLink": Boolean(rest.href), "class": cx(className) })}
    {...nativeProps}
    data-slot={"badge"}
    bind:this={ref}
  />
{:else}
  <svelte:element
    this={Tag}
    data-sw-badge
    class={badge({ "variant": resolvedVariant, "tone": resolvedTone, "appearance": resolvedAppearance, "eyebrow": eyebrow, "size": size, "isLink": Boolean(rest.href), "class": cx(className) })}
    {...nativeProps}
    data-slot={"badge"}
    bind:this={ref}
  >
    {@render children?.()}
  </svelte:element>
{/if}
