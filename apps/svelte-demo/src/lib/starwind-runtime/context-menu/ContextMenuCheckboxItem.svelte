<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ContextMenuCheckboxItem } from "@starwind-ui/svelte/context-menu";
  import { cx } from "tailwind-variants";
  import { contextMenu, contextMenuCheckboxItem, contextMenuCheckboxItemIndicator, contextMenuContent, contextMenuItem, contextMenuLabel, contextMenuRadioGroup, contextMenuRadioItem, contextMenuRadioItemIndicator, contextMenuSeparator, contextMenuShortcut, contextMenuTrigger } from "./variants.js";
  import { ContextMenuCheckboxItemIndicator } from "@starwind-ui/svelte/context-menu";

  export type ContextMenuCheckboxItemProps = ComponentProps<typeof ContextMenuCheckboxItem> & { closeOnClick?: boolean; inset?: boolean; disabled?: boolean; indicatorClass?: string; showIndicator?: boolean; indicator?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "defaultChecked": defaultChecked = false,
    "closeOnClick": closeOnClick = false,
    "inset": inset = false,
    "disabled": disabled = false,
    "indicatorClass": indicatorClassName,
    "showIndicator": showIndicator = true,
    checked = $bindable(),
    "onCheckedChange": onCheckedChange,
    "children": children,
    "indicator": indicator,
    ...rest
  }: ContextMenuCheckboxItemProps = $props();
</script>

<ContextMenuCheckboxItem
  class={contextMenuCheckboxItem({ "inset": inset, "disabled": disabled, "class": cx(className) })}
  defaultChecked={defaultChecked}
  closeOnClick={closeOnClick}
  disabled={disabled}
  {...rest}
  data-slot={"context-menu-checkbox-item"}
  onCheckedChange={onCheckedChange}
  bind:checked={checked}
>
  {#if showIndicator}
    <ContextMenuCheckboxItemIndicator
      class={contextMenuCheckboxItemIndicator({ "class": cx(indicatorClassName) })}
      data-slot={"context-menu-checkbox-item-indicator"}
    >
      {#if indicator}{@render indicator()}{:else}<svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
        class={"size-4"}
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M5 12l5 5l10 -10"}
        />
      </svg>{/if}
    </ContextMenuCheckboxItemIndicator>
  {/if}
  {@render children?.()}
</ContextMenuCheckboxItem>
