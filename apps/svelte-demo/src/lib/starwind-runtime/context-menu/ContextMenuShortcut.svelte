<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuShortcut } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuShortcutProps = ComponentProps<typeof ContextMenuShortcut> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuShortcutProps = $props();
</script>

<ContextMenuShortcut
  class={contextMenuShortcut({ "class": cx(className) })}
  {...rest}
  data-slot={"context-menu-shortcut"}
>
  {@render children?.()}
</ContextMenuShortcut>
