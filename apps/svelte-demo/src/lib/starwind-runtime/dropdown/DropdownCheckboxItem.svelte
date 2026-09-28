<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuCheckboxItem } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";
  import { MenuCheckboxItemIndicator } from "@starwind-ui/svelte/menu";

  export type DropdownCheckboxItemProps = ComponentProps<typeof MenuCheckboxItem> & { closeOnClick?: boolean; inset?: boolean; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; indicator?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "defaultChecked": defaultChecked = false,
    "closeOnClick": closeOnClick = false,
    "inset": inset = false,
    "disabled": disabled = false,
    "indicatorClass": indicatorClassName,
    "showIndicator": showIndicator = true,
    checked = $bindable(),
    "onCheckedChange": onCheckedChange,
    "children": children,
    "indicator": indicator,
    ...rest
  }: DropdownCheckboxItemProps = $props();
</script>

<MenuCheckboxItem
  class={dropdownCheckboxItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  defaultChecked={defaultChecked}
  closeOnClick={closeOnClick}
  disabled={disabled}
  {...rest}
  data-slot={"dropdown-checkbox-item"}
  onCheckedChange={onCheckedChange}
  bind:checked={checked}
>
  {#if showIndicator}
    <MenuCheckboxItemIndicator
      class={dropdownCheckboxItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"dropdown-checkbox-item-indicator"}
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
    </MenuCheckboxItemIndicator>
  {/if}
  {@render children?.()}
</MenuCheckboxItem>
