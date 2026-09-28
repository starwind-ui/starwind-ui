<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuShortcut } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownShortcutProps = ComponentProps<typeof MenuShortcut> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DropdownShortcutProps = $props();
</script>

<MenuShortcut
  class={dropdownShortcut({ "class": cx(className) })}
  {...rest}
  data-slot={"dropdown-shortcut"}
>
  {@render children?.()}
</MenuShortcut>
