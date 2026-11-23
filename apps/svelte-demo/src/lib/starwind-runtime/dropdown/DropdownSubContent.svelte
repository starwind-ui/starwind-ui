<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { MenuPopup, MenuPortal } from "@starwind-ui/svelte/menu";
  import { cx } from "tailwind-variants";
  import { dropdown, dropdownCheckboxItem, dropdownCheckboxItemIndicator, dropdownContent, dropdownItem, dropdownLabel, dropdownRadioGroup, dropdownRadioItem, dropdownRadioItemIndicator, dropdownSeparator, dropdownShortcut, dropdownTrigger } from "./variants.js";

  export type DropdownSubContentProps = ComponentProps<typeof MenuPopup> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; avoidCollisions?: boolean; disablePortal?: boolean; portalContainer?: ComponentProps<typeof MenuPortal>["container"];  };
</script>

<script lang="ts">
  let {
    "class": className,
    side,
    align = "start",
    sideOffset = 0,
    avoidCollisions = true,
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  }: DropdownSubContentProps = $props();

  let subContentClassName = $derived(className);
</script>

<MenuPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"dropdown-sub-portal"}
>
  <MenuPopup
    class={dropdownContent({ "class": cx(subContentClassName) })}
    side={side ?? "right"}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    data-sw-menu-side-intent={side ?? ""}
    {...rest}
    data-slot={"dropdown-sub-content"}
  >
    {@render children?.()}
  </MenuPopup>
</MenuPortal>
