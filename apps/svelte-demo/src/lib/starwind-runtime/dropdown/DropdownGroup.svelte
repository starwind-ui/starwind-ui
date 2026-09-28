<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuGroup } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownGroupProps = ComponentProps<typeof MenuGroup> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DropdownGroupProps = $props();
</script>

<MenuGroup
  class={className}
  {...rest}
  data-slot={"dropdown-group"}
>
  {@render children?.()}
</MenuGroup>
