<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuRoot } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownProps = ComponentProps<typeof MenuRoot> & { disabled?: boolean; modal?: boolean; openOnHover?: boolean; closeDelay?: number;  };
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen,
    "disabled": disabled = false,
    "modal": modal = false,
    "openOnHover": openOnHover = false,
    "closeDelay": closeDelay = 200,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "onCloseComplete": onCloseComplete,
    "children": children,
    ...rest
  }: DropdownProps = $props();
</script>

<MenuRoot
  class={dropdown({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  disabled={disabled}
  modal={modal}
  openOnHover={openOnHover}
  closeDelay={closeDelay}
  {...rest}
  data-slot={"dropdown"}
  onOpenChange={onOpenChange}
  onCloseComplete={onCloseComplete}
  children={children}
  bind:open={open}
>

</MenuRoot>
