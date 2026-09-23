<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuTrigger } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownTriggerProps = ComponentProps<typeof MenuTrigger> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "child": child,
    "children": children,
    ...rest
  }: DropdownTriggerProps = $props();

  let triggerBaseClassName = $derived(dropdownTrigger({ "class": cx(className) }));

  let triggerClassName = $derived(child ? className : triggerBaseClassName);
</script>

<MenuTrigger
  class={triggerClassName}
  child={child}
  {...rest}
  data-slot={"dropdown-trigger"}
>
  {@render children?.()}
</MenuTrigger>
