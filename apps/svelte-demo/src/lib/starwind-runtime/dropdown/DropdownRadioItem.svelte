<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuRadioItem } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";
  import { MenuRadioItemIndicator } from "@starwind-ui/svelte/menu";

  export type DropdownRadioItemProps = ComponentProps<typeof MenuRadioItem> & { closeOnClick?: boolean; inset?: boolean; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; indicator?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "value": value,
    "checked": checked,
    "defaultChecked": defaultChecked = false,
    "closeOnClick": closeOnClick = false,
    "inset": inset = false,
    "disabled": disabled = false,
    "indicatorClass": indicatorClassName,
    "showIndicator": showIndicator = true,
    "children": children,
    "indicator": indicator,
    ...rest
  }: DropdownRadioItemProps = $props();
</script>

<MenuRadioItem
  class={dropdownRadioItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  value={value}
  checked={checked}
  defaultChecked={defaultChecked}
  closeOnClick={closeOnClick}
  disabled={disabled}
  {...rest}
  data-slot={"dropdown-radio-item"}
>
  {#if showIndicator}
    <MenuRadioItemIndicator
      class={dropdownRadioItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"dropdown-radio-item-indicator"}
    >
      {#if indicator}{@render indicator()}{:else}<span
        class={"size-2 rounded-full bg-current"}
      >

      </span>{/if}
    </MenuRadioItemIndicator>
  {/if}
  {@render children?.()}
</MenuRadioItem>
