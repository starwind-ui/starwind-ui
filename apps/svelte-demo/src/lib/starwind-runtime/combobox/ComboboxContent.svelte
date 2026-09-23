<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxPopup, ComboboxPortal } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";
  import { ComboboxPositioner } from "@starwind-ui/svelte/combobox";
  import { ComboboxList } from "@starwind-ui/svelte/combobox";

  export type ComboboxContentProps = Omit<ComponentProps<typeof ComboboxPopup>, "children"> & { children?: Snippet;   align?: "start" | "center" | "end"; alignOffset?: number; avoidCollisions?: boolean; side?: "top" | "right" | "bottom" | "left"; sideOffset?: number; size?: "sm" | "md" | "lg"; disablePortal?: boolean; portalContainer?: ComponentProps<typeof ComboboxPortal>["container"]; };
</script>

<script lang="ts">
  let {
    "align": align = "start",
    "alignOffset": alignOffset = 0,
    "avoidCollisions": avoidCollisions = true,
    "class": className,
    "side": side = "bottom",
    "sideOffset": sideOffset = 4,
    "size": size = "md",
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: ComboboxContentProps = $props();
</script>

<ComboboxPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"combobox-portal"}
>
  <ComboboxPositioner
    align={align}
    alignOffset={alignOffset}
    avoidCollisions={avoidCollisions}
    side={side}
    sideOffset={sideOffset}
    data-slot={"combobox-positioner"}
  >
    <ComboboxPopup
      class={comboboxContent({ "size": size, "class": cx(className) })}
      align={align}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      side={side}
      sideOffset={sideOffset}
      {...rest}
      data-size={size}
      data-slot={"combobox-content"}
    >
      <ComboboxList
        class={comboboxList({  })}
        data-slot={"combobox-list"}
      >
        {@render children?.()}
      </ComboboxList>
    </ComboboxPopup>
  </ComboboxPositioner>
</ComboboxPortal>
