<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuSubmenuTrigger } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownSubTriggerProps = ComponentProps<typeof MenuSubmenuTrigger> & { inset?: boolean; disabled?: boolean; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "disabled": disabled = false,
    "children": children,
    "icon": icon,
    ...rest
  }: DropdownSubTriggerProps = $props();

  let subTriggerClassName = $derived(className);
</script>

<MenuSubmenuTrigger
  class={dropdownItem({ "inset": inset, "disabled": disabled, "class": cx(subTriggerClassName) })}
  disabled={disabled}
  {...rest}
  data-slot={"dropdown-sub-trigger"}
>
  {@render children?.()}
  <svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={"ml-auto size-4"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M9 6l6 6l-6 6"}
    />
  </svg>
</MenuSubmenuTrigger>
