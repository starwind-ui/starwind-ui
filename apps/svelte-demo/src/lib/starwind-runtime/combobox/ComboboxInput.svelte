<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxInput } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";
  import { InputGroup } from "../input-group/index.js";
  import { InputGroupAddon } from "../input-group/index.js";
  import { ComboboxTrigger } from "@starwind-ui/svelte/combobox";
  import { InputGroupButton } from "../input-group/index.js";
  import { ComboboxClear } from "@starwind-ui/svelte/combobox";

  export type ComboboxInputProps = Omit<ComponentProps<typeof ComboboxInput>, "children" | "size"> & VariantProps<typeof comboboxInputGroup> & { children?: Snippet;   showClear?: boolean; showTrigger?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    "disabled": disabled = false,
    "size": size = "md",
    "showClear": showClear = false,
    "showTrigger": showTrigger = true,
    "children": children,
    ...rest
  }: ComboboxInputProps = $props();
</script>

<InputGroup
  class={comboboxInputGroup({ "size": size, "class": cx(className) })}
  data-size={size}
  data-sw-combobox-input-group={""}
>
  <ComboboxInput
    class={comboboxInput({  })}
    disabled={!!disabled}
    {...rest}
    data-slot={"combobox-input"}
  >

  </ComboboxInput>
  <InputGroupAddon
    align={"inline-end"}
  >
    {#if showTrigger}
      <ComboboxTrigger
        disabled={!!disabled}
        data-slot={"combobox-trigger"}
      >
        {#snippet child({ props: buttonProps })}
          <InputGroupButton
            size={"icon-sm"}
            variant={"ghost"}
            disabled={!!disabled}
            data-slot={"combobox-trigger"}
            {...buttonProps}
            class={["group-has-data-[slot=combobox-clear]/input-group:hidden", buttonProps.class].filter(Boolean).join(" ")}
          >
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              stroke-width={"2"}
              stroke-linecap={"round"}
              stroke-linejoin={"round"}
              aria-hidden={"true"}
              class={"text-muted-foreground pointer-events-none size-4"}
            >
              <path
                stroke={"none"}
                d={"M0 0h24v24H0z"}
                fill={"none"}
              />
              <path
                d={"M6 9l6 6l6 -6"}
              />
            </svg>
          </InputGroupButton>
        {/snippet}
      </ComboboxTrigger>
    {/if}
    {#if showClear}
      <ComboboxClear
        disabled={!!disabled}
        aria-label={"Clear selection"}
        data-slot={"combobox-clear"}
      >
        {#snippet child({ props: buttonProps })}
          <InputGroupButton
            size={"icon-sm"}
            variant={"ghost"}
            disabled={!!disabled}
            data-slot={"combobox-clear"}
            {...buttonProps}
            class={[buttonProps.class].filter(Boolean).join(" ")}
          >
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              stroke-width={"2"}
              stroke-linecap={"round"}
              stroke-linejoin={"round"}
              aria-hidden={"true"}
              class={"text-muted-foreground pointer-events-none size-4"}
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
          </InputGroupButton>
        {/snippet}
      </ComboboxClear>
    {/if}
  </InputGroupAddon>
  {@render children?.()}
</InputGroup>
