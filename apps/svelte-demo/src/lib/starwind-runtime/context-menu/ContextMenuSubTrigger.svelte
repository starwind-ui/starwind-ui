<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuSubmenuTrigger } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";

  export type ContextMenuSubTriggerProps = ComponentProps<typeof ContextMenuSubmenuTrigger> & { inset?: boolean; disabled?: boolean; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "inset": inset = false,
    "disabled": disabled = false,
    "children": children,
    "icon": icon,
    ...rest
  }: ContextMenuSubTriggerProps = $props();

  let subTriggerClassName = $derived(className);
</script>

<ContextMenuSubmenuTrigger
  class={contextMenuItem({ "inset": inset, "disabled": disabled, "class": cx(subTriggerClassName) })}
  disabled={disabled}
  {...rest}
  data-slot={"context-menu-sub-trigger"}
>
  {@render children?.()}
  <svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={"ml-auto size-4"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M9 6l6 6l-6 6"}
    />
  </svg>
</ContextMenuSubmenuTrigger>
