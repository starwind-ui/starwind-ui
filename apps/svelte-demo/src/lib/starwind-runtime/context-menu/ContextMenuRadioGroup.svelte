<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuRadioGroup } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuRadioGroupProps = ComponentProps<typeof ContextMenuRadioGroup> & {   };
</script>

<script lang="ts">
  let {
    "class": className,
    "defaultValue": defaultValue,
    value = $bindable(),
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: ContextMenuRadioGroupProps = $props();
</script>

<ContextMenuRadioGroup
  class={contextMenuRadioGroup({ "class": cx(className) })}
  defaultValue={defaultValue}
  {...rest}
  data-slot={"context-menu-radio-group"}
  onValueChange={onValueChange}
  bind:value={value}
>
  {@render children?.()}
</ContextMenuRadioGroup>
