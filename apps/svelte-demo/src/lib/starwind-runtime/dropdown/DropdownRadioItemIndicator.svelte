<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuRadioItemIndicator } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownRadioItemIndicatorProps = ComponentProps<typeof MenuRadioItemIndicator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DropdownRadioItemIndicatorProps = $props();
</script>

<MenuRadioItemIndicator
  class={dropdownRadioItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"dropdown-radio-item-indicator"}
>
  {@render children?.()}
</MenuRadioItemIndicator>
