<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxItem } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";
  import { ComboboxItemText } from "@starwind-ui/svelte/combobox";
  import { ComboboxItemIndicator } from "@starwind-ui/svelte/combobox";

  export type ComboboxItemProps = Omit<ComponentProps<typeof ComboboxItem>, "children"> & VariantProps<typeof comboboxItem> & { children?: Snippet;  indicator?: Snippet; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; value: string; };
</script>

<script lang="ts">
  let {
    "class": className,
    "disabled": disabled = false,
    "indicatorClass": indicatorClassName,
    "inset": inset = false,
    "showIndicator": showIndicator = true,
    "value": value,
    "children": children,
    "indicator": indicator,
    ...rest
  }: ComboboxItemProps = $props();
</script>

<ComboboxItem
  class={comboboxItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  disabled={disabled}
  value={value}
  {...rest}
  data-slot={"combobox-item"}
>
  <ComboboxItemText
    class={comboboxItemText({  })}
    data-slot={"combobox-item-text"}
  >
    {@render children?.()}
  </ComboboxItemText>
  {#if showIndicator}
    <ComboboxItemIndicator
      class={comboboxItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"combobox-item-indicator"}
    >
      {#if indicator}{@render indicator()}{:else}<svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
        class={"size-4"}
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M5 12l5 5l10 -10"}
        />
      </svg>{/if}
    </ComboboxItemIndicator>
  {/if}
</ComboboxItem>
