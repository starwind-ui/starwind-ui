<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuRadioGroup } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownRadioGroupProps = ComponentProps<typeof MenuRadioGroup> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "defaultValue": defaultValue,
    value = $bindable(),
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: DropdownRadioGroupProps = $props();
</script>

<MenuRadioGroup
  class={dropdownRadioGroup({ "class": cx(className) })}
  defaultValue={defaultValue}
  {...rest}
  data-slot={"dropdown-radio-group"}
  onValueChange={onValueChange}
  bind:value={value}
>
  {@render children?.()}
</MenuRadioGroup>
