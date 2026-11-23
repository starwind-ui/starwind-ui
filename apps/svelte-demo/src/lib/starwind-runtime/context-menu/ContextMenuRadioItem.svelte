<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuRadioItem } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";
  import { ContextMenuRadioItemIndicator } from "@starwind-ui/svelte/context-menu";

  export type ContextMenuRadioItemProps = ComponentProps<typeof ContextMenuRadioItem> & { closeOnClick?: boolean; inset?: boolean; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; indicator?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    value,
    checked,
    defaultChecked = false,
    closeOnClick = false,
    inset = false,
    disabled = false,
    "indicatorClass": indicatorClassName,
    showIndicator = true,
    children,
    indicator,
    ...rest
  }: ContextMenuRadioItemProps = $props();
</script>

<ContextMenuRadioItem
  class={contextMenuRadioItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  value={value}
  checked={checked}
  defaultChecked={defaultChecked}
  closeOnClick={closeOnClick}
  disabled={disabled}
  {...rest}
  data-slot={"context-menu-radio-item"}
>
  {#if showIndicator}
    <ContextMenuRadioItemIndicator
      class={contextMenuRadioItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"context-menu-radio-item-indicator"}
    >
      {#if indicator}{@render indicator()}{:else}<span
        class={"size-2 rounded-full bg-current"}
      >

      </span>{/if}
    </ContextMenuRadioItemIndicator>
  {/if}
  {@render children?.()}
</ContextMenuRadioItem>
