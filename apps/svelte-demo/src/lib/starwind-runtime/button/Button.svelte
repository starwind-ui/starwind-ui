<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ButtonRoot } from "@starwind-ui/svelte/button";
  import { button } from "./variants.js";

  type NativeButtonProps = ComponentProps<typeof ButtonRoot>;
  type CommonProps = VariantProps<typeof button> & { "data-slot"?: string; "focusableWhenDisabled"?: boolean; };
  type AnchorProps = Omit<HTMLAnchorAttributes, "type" | "children"> & CommonProps & {
    children?: NativeButtonProps["children"];
    child?: never;
    disabled?: boolean;
    ref?: (element: HTMLAnchorElement | null) => void;
  } & ({ as: "a"; href?: string } | { as?: "a" | "button"; href: string });
  export type ButtonProps = (NativeButtonProps & CommonProps & { as?: "button"; href?: undefined }) | AnchorProps;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "size": size,
    "as": buttonAs,
    "href": href,
    "disabled": disabled = false,
    "focusableWhenDisabled": focusableWhenDisabled,
    "data-slot": dataSlot = "button",
    "class": className,
    "ref": ref,
    "tabindex": tabindex,
    "children": children,
    ...rest
  }: ButtonProps = $props();

  let nativeAnchorProps = $derived({ ...rest } as HTMLAnchorAttributes);
  let anchorRef = $derived(ref as ((element: HTMLAnchorElement | null) => void) | undefined);
  function attachAnchor(element: HTMLAnchorElement): () => void {
    $effect(() => {
      const callback = anchorRef;
      untrack(() => callback?.(element));
      return () => untrack(() => callback?.(null));
    });
    return () => {};
  }
</script>

{#if buttonAs === "a" || href !== undefined}
  <a
    class={button({ "variant": variant, "size": size, "class": cx(className) })}
    href={disabled ? undefined : href}
    aria-disabled={disabled ? "true" : undefined}
    data-disabled={disabled ? "" : undefined}
    {...nativeAnchorProps}
    data-slot={dataSlot}
    tabindex={disabled ? -1 : tabindex}
    {@attach attachAnchor}
  >
    {@render children?.()}
  </a>
{:else}
  <ButtonRoot
    class={button({ "variant": variant, "size": size, "class": cx(className) })}
    disabled={disabled}
    focusableWhenDisabled={focusableWhenDisabled}
    {...rest as NativeButtonProps}
    data-slot={dataSlot}
    ref={ref as NativeButtonProps["ref"]}
    tabindex={tabindex}
  >
    {@render children?.()}
  </ButtonRoot>
{/if}
