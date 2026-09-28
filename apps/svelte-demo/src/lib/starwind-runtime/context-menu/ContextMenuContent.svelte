<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuPopup, ContextMenuPortal } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuContentProps = ComponentProps<typeof ContextMenuPopup> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; avoidCollisions?: boolean; disablePortal?: boolean; portalContainer?: ComponentProps<typeof ContextMenuPortal>["container"];  };
</script>

<script lang="ts">
  let {
    "class": className,
    "side": side = "bottom",
    "align": align = "start",
    "sideOffset": sideOffset = 4,
    "avoidCollisions": avoidCollisions = true,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: ContextMenuContentProps = $props();
</script>

<ContextMenuPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"context-menu-portal"}
>
  <ContextMenuPopup
    class={contextMenuContent({ "class": cx(className) })}
    side={side}
    align={align}
    sideOffset={sideOffset}
    avoidCollisions={avoidCollisions}
    {...rest}
    data-slot={"context-menu-content"}
  >
    {@render children?.()}
  </ContextMenuPopup>
</ContextMenuPortal>
