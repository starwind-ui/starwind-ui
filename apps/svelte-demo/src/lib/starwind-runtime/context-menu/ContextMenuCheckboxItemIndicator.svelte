<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuCheckboxItemIndicator } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuCheckboxItemIndicatorProps = ComponentProps<typeof ContextMenuCheckboxItemIndicator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuCheckboxItemIndicatorProps = $props();
</script>

<ContextMenuCheckboxItemIndicator
  class={contextMenuCheckboxItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"context-menu-checkbox-item-indicator"}
>
  {@render children?.()}
</ContextMenuCheckboxItemIndicator>
