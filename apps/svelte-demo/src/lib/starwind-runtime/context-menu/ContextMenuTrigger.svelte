<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuTrigger } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuTrigger> & { disabled?: boolean;  };
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "class": className,
    "children": children,
    ...rest
  }: ContextMenuTriggerProps = $props();
</script>

<ContextMenuTrigger
  class={contextMenuTrigger({ "class": cx(className) })}
  disabled={disabled}
  {...rest}
  data-slot={"context-menu-trigger"}
>
  {@render children?.()}
</ContextMenuTrigger>
