<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuGroup } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuGroupProps = ComponentProps<typeof ContextMenuGroup> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuGroupProps = $props();
</script>

<ContextMenuGroup
  class={className}
  {...rest}
  data-slot={"context-menu-group"}
>
  {@render children?.()}
</ContextMenuGroup>
