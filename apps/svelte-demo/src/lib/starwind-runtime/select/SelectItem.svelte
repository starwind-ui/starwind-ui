<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectItem } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";
  import { SelectItemText } from "@starwind-ui/svelte/select";
  import { SelectItemIndicator } from "@starwind-ui/svelte/select";

  export type SelectItemProps = Omit<ComponentProps<typeof SelectItem>, "children"> & VariantProps<typeof selectItem> & { children?: Snippet; indicator?: Snippet; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; value: string; };
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
  }: SelectItemProps = $props();
</script>

<SelectItem
  class={selectItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  disabled={disabled}
  value={value}
  {...rest}
  data-slot={"select-item"}
>
  <SelectItemText
    class={selectItemText({  })}
    data-slot={"select-item-text"}
  >
    {@render children?.()}
  </SelectItemText>
  {#if showIndicator}
    <SelectItemIndicator
      class={selectItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"select-item-indicator"}
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
    </SelectItemIndicator>
  {/if}
</SelectItem>
