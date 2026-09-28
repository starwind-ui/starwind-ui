<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuItem } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownItemProps = ComponentProps<typeof MenuItem> & { inset?: boolean; disabled?: boolean;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "disabled": disabled = false,
    "children": children,
    ...rest
  }: DropdownItemProps = $props();
</script>

<MenuItem
  class={dropdownItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  disabled={disabled}
  {...rest}
  data-slot={"dropdown-item"}
>
  {@render children?.()}
</MenuItem>
