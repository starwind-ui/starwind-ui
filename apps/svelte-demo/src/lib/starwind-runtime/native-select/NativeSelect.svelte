<script module lang="ts">
  import type { Snippet } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { nativeSelect, nativeSelectWrapper, nativeSelectIcon } from "./variants.js";

  export type NativeSelectProps = Omit<SvelteHTMLElements["select"], "size" | "defaultValue" | "defaultvalue"> & VariantProps<typeof nativeSelect> & { ref?: HTMLSelectElement;  icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "size": size,
    "class": className,
    value = $bindable(),
    ref = $bindable(),
    "icon": icon,
    "children": children,
    ...rest
  }: NativeSelectProps = $props();

  let nativeProps = $derived.by(() => {
    const props = { ...rest };
    for (const key of ["size","defaultValue","defaultvalue"]) delete (props as Record<string, unknown>)[key];
    return props;
  });
</script>

<div
  class={nativeSelectWrapper({  })}
  data-size={size}
  data-slot={"native-select-wrapper"}
>
  {#if nativeProps.multiple && value === undefined}
    <svelte:element
      this={"select"}
      class={nativeSelect({ "size": size, "class": cx(className) })}
      {...nativeProps}
      data-slot={"native-select"}
      bind:this={ref}
    >
      {@render children?.()}
    </svelte:element>
  {:else}
    <select
      class={nativeSelect({ "size": size, "class": cx(className) })}
      {...nativeProps}
      data-slot={"native-select"}
      bind:value={value}
      bind:this={ref}
    >
      {@render children?.()}
    </select>
  {/if}
  {#if icon}{@render icon()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={nativeSelectIcon({ "size": size })}
    data-slot={"native-select-icon"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M6 9l6 6l6 -6"}
    />
  </svg>{/if}
</div>
