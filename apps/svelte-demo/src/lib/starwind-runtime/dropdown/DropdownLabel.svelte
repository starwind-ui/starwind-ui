<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuLabel } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownLabelProps = ComponentProps<typeof MenuLabel> & { inset?: boolean;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "children": children,
    ...rest
  }: DropdownLabelProps = $props();
</script>

<MenuLabel
  class={dropdownLabel({ "inset": inset, "class": cx(className) })}
  {...rest}
  data-slot={"dropdown-label"}
>
  {@render children?.()}
</MenuLabel>
