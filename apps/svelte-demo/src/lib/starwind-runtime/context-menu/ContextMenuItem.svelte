<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuItem } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuItemProps = ComponentProps<typeof ContextMenuItem> & { inset?: boolean; disabled?: boolean;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "disabled": disabled = false,
    "children": children,
    ...rest
  }: ContextMenuItemProps = $props();
</script>

<ContextMenuItem
  class={contextMenuItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  disabled={disabled}
  {...rest}
  data-slot={"context-menu-item"}
>
  {@render children?.()}
</ContextMenuItem>
