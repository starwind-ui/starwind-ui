<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuSubmenuRoot } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuSubProps = ComponentProps<typeof ContextMenuSubmenuRoot> & { closeDelay?: number;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "closeDelay": closeDelay = 200,
    "children": children,
    ...rest
  }: ContextMenuSubProps = $props();
</script>

<ContextMenuSubmenuRoot
  class={["relative", className].filter(Boolean).join(" ")}
  closeDelay={closeDelay}
  {...rest}
  data-slot={"context-menu-sub"}
>
  {@render children?.()}
</ContextMenuSubmenuRoot>
