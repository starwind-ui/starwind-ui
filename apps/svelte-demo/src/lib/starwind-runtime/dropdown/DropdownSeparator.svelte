<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuSeparator } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownSeparatorProps = ComponentProps<typeof MenuSeparator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DropdownSeparatorProps = $props();
</script>

<MenuSeparator
  class={dropdownSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"dropdown-separator"}
>

</MenuSeparator>
