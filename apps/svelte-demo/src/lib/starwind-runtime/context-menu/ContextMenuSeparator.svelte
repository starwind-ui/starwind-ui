<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuSeparator } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuSeparatorProps = ComponentProps<typeof ContextMenuSeparator> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuSeparatorProps = $props();
</script>

<ContextMenuSeparator
  class={contextMenuSeparator({ "class": cx(className) })}
  {...rest}
  data-slot={"context-menu-separator"}
>

</ContextMenuSeparator>
