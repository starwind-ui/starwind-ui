<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuRadioItemIndicator } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuRadioItemIndicatorProps = ComponentProps<typeof ContextMenuRadioItemIndicator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuRadioItemIndicatorProps = $props();
</script>

<ContextMenuRadioItemIndicator
  class={contextMenuRadioItemIndicator({ "class": cx(className) })}
  {...rest}
  data-slot={"context-menu-radio-item-indicator"}
>
  {@render children?.()}
</ContextMenuRadioItemIndicator>
