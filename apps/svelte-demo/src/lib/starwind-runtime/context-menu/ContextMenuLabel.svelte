<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuLabel } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuLabelProps = ComponentProps<typeof ContextMenuLabel> & { inset?: boolean;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "children": children,
    ...rest
  }: ContextMenuLabelProps = $props();
</script>

<ContextMenuLabel
  class={contextMenuLabel({ "inset": inset, "class": cx(className) })}
  {...rest}
  data-slot={"context-menu-label"}
>
  {@render children?.()}
</ContextMenuLabel>
