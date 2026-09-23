<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuLinkItem } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownLinkItemProps = ComponentProps<typeof MenuLinkItem> & { closeOnClick?: boolean; inset?: boolean; disabled?: boolean;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "closeOnClick": closeOnClick = false,
    "inset": inset = false,
    "disabled": disabled = false,
    "children": children,
    ...rest
  }: DropdownLinkItemProps = $props();
</script>

<MenuLinkItem
  class={dropdownItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  closeOnClick={closeOnClick}
  disabled={disabled}
  {...rest}
  data-slot={"dropdown-link-item"}
>
  {@render children?.()}
</MenuLinkItem>
