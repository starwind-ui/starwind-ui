<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuSubmenuRoot } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownSubProps = ComponentProps<typeof MenuSubmenuRoot> & { closeDelay?: number;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "closeDelay": closeDelay = 200,
    "children": children,
    ...rest
  }: DropdownSubProps = $props();
</script>

<MenuSubmenuRoot
  class={["relative", className].filter(Boolean).join(" ")}
  closeDelay={closeDelay}
  {...rest}
  data-slot={"dropdown-sub"}
>
  {@render children?.()}
</MenuSubmenuRoot>
