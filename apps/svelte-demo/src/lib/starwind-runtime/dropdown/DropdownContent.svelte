<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuPopup, MenuPortal } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownContentProps = ComponentProps<typeof MenuPopup> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; avoidCollisions?: boolean; disablePortal?: boolean; portalContainer?: ComponentProps<typeof MenuPortal>["container"];  };
</script>

<script lang="ts">
  let {
    "class": className,
    side = "bottom",
    align = "start",
    sideOffset = 4,
    avoidCollisions = true,
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  }: DropdownContentProps = $props();
</script>

<MenuPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"dropdown-portal"}
>
  <MenuPopup
    class={dropdownContent({ "class": cx(className) })}
    side={side}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    {...rest}
    data-slot={"dropdown-content"}
  >
    {@render children?.()}
  </MenuPopup>
</MenuPortal>
