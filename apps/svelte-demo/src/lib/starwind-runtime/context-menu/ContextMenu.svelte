<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuRoot } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuProps = ComponentProps<typeof ContextMenuRoot> & { disabled?: boolean; modal?: boolean; closeDelay?: number;  };
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen,
    "disabled": disabled = false,
    "modal": modal = true,
    "closeDelay": closeDelay = 200,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "onCloseComplete": onCloseComplete,
    "children": children,
    ...rest
  }: ContextMenuProps = $props();
</script>

<ContextMenuRoot
  class={contextMenu({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  disabled={disabled}
  modal={modal}
  closeDelay={closeDelay}
  {...rest}
  data-slot={"context-menu"}
  onOpenChange={onOpenChange}
  onCloseComplete={onCloseComplete}
  children={children}
  bind:open={open}
>

</ContextMenuRoot>
