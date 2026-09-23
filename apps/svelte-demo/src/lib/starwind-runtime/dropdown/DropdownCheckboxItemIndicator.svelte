<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuCheckboxItemIndicator } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownCheckboxItemIndicatorProps = ComponentProps<typeof MenuCheckboxItemIndicator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DropdownCheckboxItemIndicatorProps = $props();
</script>

<MenuCheckboxItemIndicator
  class={dropdownCheckboxItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"dropdown-checkbox-item-indicator"}
>
  {@render children?.()}
</MenuCheckboxItemIndicator>
