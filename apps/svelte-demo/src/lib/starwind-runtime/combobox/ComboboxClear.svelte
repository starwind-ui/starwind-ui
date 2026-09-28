<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxClear } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";
  import { InputGroupButton } from "../input-group/index.js";

  export type ComboboxClearProps = Omit<ComponentProps<typeof ComboboxClear>, "children"> & { children?: Snippet;   showIcon?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    "disabled": disabled = false,
    "showIcon": showIcon = true,
    "child": child,
    "children": children,
    ...rest
  }: ComboboxClearProps = $props();
</script>

{#if child}
  <ComboboxClear
    class={comboboxClear({ "class": cx(className) })}
    child={child}
    disabled={disabled}
    {...rest}
    aria-label={"Clear selection"}
    data-slot={"combobox-clear"}
  >
    {@render children?.()}
    {#if showIcon}
      <svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M18 6l-12 12"}
        />
        <path
          d={"M6 6l12 12"}
        />
      </svg>
    {/if}
  </ComboboxClear>
{:else}
  <ComboboxClear
    disabled={disabled}
    {...rest}
    aria-label={"Clear selection"}
    data-slot={"combobox-clear"}
  >
    {#snippet child({ props: buttonProps })}
      <InputGroupButton
        size={"icon-sm"}
        variant={"ghost"}
        disabled={disabled}
        data-slot={"combobox-clear"}
        {...buttonProps}
        class={[comboboxClear({ "class": cx(className) }), buttonProps.class].filter(Boolean).join(" ")}
      >
        {@render children?.()}
        {#if showIcon}
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 0 24 24"}
            fill={"none"}
            stroke={"currentColor"}
            stroke-width={"2"}
            stroke-linecap={"round"}
            stroke-linejoin={"round"}
            aria-hidden={"true"}
          >
            <path
              stroke={"none"}
              d={"M0 0h24v24H0z"}
              fill={"none"}
            />
            <path
              d={"M18 6l-12 12"}
            />
            <path
              d={"M6 6l12 12"}
            />
          </svg>
        {/if}
      </InputGroupButton>
    {/snippet}
  </ComboboxClear>
{/if}
