<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerRoot } from "@starwind-ui/svelte/color-picker";
  import { Popover } from "../popover/index.js";
  import { ColorPickerLabel } from "@starwind-ui/svelte/color-picker";
  import { default as ColorPickerDefaultEditor } from "./ColorPickerDefaultEditor.svelte";
  import { ColorPickerControl } from "@starwind-ui/svelte/color-picker";
  import { default as ColorPickerTrigger } from "./ColorPickerTrigger.svelte";
  import { default as ColorPickerContent } from "./ColorPickerContent.svelte";
  import { ColorPickerHiddenInput } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerProps = Omit<ComponentProps<typeof ColorPickerRoot>, "children" | "allowEmpty"> & Pick<ComponentProps<typeof Popover>, "open" | "defaultOpen" | "onOpenChange" | "onCloseComplete" | "closeOnEscape" | "closeOnOutsideInteract" | "modal" | "openOnHover" | "closeDelay"> & VariantProps<typeof colorPicker> & {children?:Snippet; value?: import("@starwind-ui/svelte/color-picker").ColorPickerValue; defaultValue?: import("@starwind-ui/svelte/color-picker").ColorPickerValue; format?: import("@starwind-ui/svelte/color-picker").ColorPickerFormat; alpha?: boolean; clearable?: boolean; disabled?: boolean; readOnly?: boolean; name?: string; form?: string; required?: boolean; locale?: string; dir?: import("@starwind-ui/svelte/color-picker").ColorPickerDirection; inline?: boolean; label?: string; showEyeDropper?: boolean; showValueText?: boolean; formatControl?: "select" | "native" | "none"; formats?: readonly import("@starwind-ui/svelte/color-picker").ColorPickerFormat[]; swatches?: readonly (import("@starwind-ui/svelte/color-picker").ColorPickerValue | { value: import("@starwind-ui/svelte/color-picker").ColorPickerValue; label: string; disabled?: boolean })[]; defaultOpen?: boolean; open?: boolean; closeOnEscape?: boolean; closeOnOutsideInteract?: boolean; modal?: boolean; openOnHover?: boolean; closeDelay?: number; side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number; avoidCollisions?: boolean; portalContainer?: string; disablePortal?: boolean; onValueChange?: (value: import("@starwind-ui/svelte/color-picker").ColorPickerColor | null, details: import("@starwind-ui/svelte/color-picker").ColorPickerValueChangeDetails) => void; onValueCommitted?: (value: import("@starwind-ui/svelte/color-picker").ColorPickerColor | null, details: import("@starwind-ui/svelte/color-picker").ColorPickerValueCommitDetails) => void; onFormatChange?: (format: import("@starwind-ui/svelte/color-picker").ColorPickerFormat, details: import("@starwind-ui/svelte/color-picker").ColorPickerFormatChangeDetails) => void; };
</script>

<script lang="ts">
  let {
    value = $bindable(),
    "defaultValue": defaultValue = "#000000",
    format = $bindable(),
    "alpha": alpha = true,
    "clearable": clearable = false,
    "disabled": disabled = false,
    "readOnly": readOnly = false,
    "name": name,
    "form": form,
    "required": required = false,
    "locale": locale,
    "dir": dir,
    "inline": inline = false,
    "label": label,
    "showEyeDropper": showEyeDropper = true,
    "showValueText": showValueText = true,
    "formatControl": formatControl = "select",
    "formats": formats = ["hex","rgb","hsl","hsb"],
    "swatches": swatches = [],
    "defaultOpen": defaultOpen = false,
    open = $bindable(),
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = true,
    "modal": modal = false,
    "openOnHover": openOnHover = false,
    "closeDelay": closeDelay = 200,
    "side": side = "bottom",
    "align": align = "start",
    "sideOffset": sideOffset = 4,
    "avoidCollisions": avoidCollisions = true,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "onValueChange": onValueChange,
    "onValueCommitted": onValueCommitted,
    "onFormatChange": onFormatChange,
    "onOpenChange": onOpenChange,
    "onCloseComplete": onCloseComplete,
    "class": className,
    "size": size = "md",
    "children": children,
    ...rest
  }: ColorPickerProps = $props();

  let resolvedFormat = $derived(format ?? "hex");

  let requestedFormats = $derived(Array.from(new Set(formats)));

  let normalizedFormats = $derived(requestedFormats.includes(resolvedFormat) ? requestedFormats : [resolvedFormat, ...requestedFormats]);
</script>

<Popover
  defaultOpen={defaultOpen}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  modal={modal}
  openOnHover={openOnHover}
  closeDelay={closeDelay}
  onOpenChange={onOpenChange}
  onCloseComplete={onCloseComplete}
  bind:open={open}
>
  <ColorPickerRoot
    class={colorPicker({ "size": size, "class": cx(className) })}
    defaultValue={defaultValue}
    alpha={alpha}
    allowEmpty={clearable}
    disabled={disabled}
    readOnly={readOnly}
    name={name}
    form={form}
    required={required}
    locale={locale}
    dir={dir}
    onValueChange={onValueChange}
    onValueCommitted={onValueCommitted}
    onFormatChange={onFormatChange}
    {...rest}
    data-size={size}
    data-floating-root={inline ? undefined : true}
    data-slot={"color-picker"}
    bind:value={value}
    bind:format={format}
  >
    {#if inline}
      {#if children}{@render children()}{:else}{#if label != null}
        <ColorPickerLabel
          class={colorPickerLabel({  })}
          data-slot={"color-picker-label"}
        >
          {label}
        </ColorPickerLabel>
      {/if}
      <ColorPickerDefaultEditor
        size={size}
        formatControl={formatControl}
        formats={normalizedFormats}
        showEyeDropper={showEyeDropper}
        swatches={swatches}
        portalContainer={portalContainer}
        disablePortal={disablePortal}
      >

      </ColorPickerDefaultEditor>{/if}
    {:else}
      {#if children}{@render children()}{:else}{#if label != null}
        <ColorPickerLabel
          class={colorPickerLabel({  })}
          data-slot={"color-picker-label"}
        >
          {label}
        </ColorPickerLabel>
      {/if}
      <ColorPickerControl
        class={colorPickerControl({  })}
        data-slot={"color-picker-control"}
      >
        <ColorPickerTrigger
          showValueText={showValueText}
          aria-label={label ? `Open ${label.toLowerCase()} picker` : "Open color picker"}
        >

        </ColorPickerTrigger>
      </ColorPickerControl>
      <ColorPickerContent
        size={size}
        formatControl={formatControl}
        formats={normalizedFormats}
        showEyeDropper={showEyeDropper}
        swatches={swatches}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        portalContainer={portalContainer}
        disablePortal={disablePortal}
        aria-label={label ? `${label} editor` : "Color editor"}
      >

      </ColorPickerContent>{/if}
    {/if}
    <ColorPickerHiddenInput
      class={colorPickerHiddenInput({  })}
      data-slot={"color-picker-hidden-input"}
    >

    </ColorPickerHiddenInput>
  </ColorPickerRoot>
</Popover>
