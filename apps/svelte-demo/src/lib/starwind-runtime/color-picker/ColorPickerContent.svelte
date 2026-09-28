<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { PopoverContent } from "../popover/index.js";
  import { default as ColorPickerDefaultEditor } from "./ColorPickerDefaultEditor.svelte";
  import "./styles.css";

  export type ColorPickerContentProps = ComponentProps<typeof PopoverContent> & VariantProps<typeof colorPickerContent> & {children?:Snippet; showEyeDropper?: boolean; formatControl?: "select" | "native" | "none"; formats?: readonly import("@starwind-ui/svelte/color-picker").ColorPickerFormat[]; swatches?: readonly (import("@starwind-ui/svelte/color-picker").ColorPickerValue | { value: import("@starwind-ui/svelte/color-picker").ColorPickerValue; label: string; disabled?: boolean })[];};
</script>

<script lang="ts">
  let {
    "class": className,
    "size": size = "md",
    "showEyeDropper": showEyeDropper = true,
    "formatControl": formatControl = "select",
    "formats": formats = ["hex","rgb","hsl","hsb"],
    "swatches": swatches = [],
    "side": side = "bottom",
    "align": align = "start",
    "exitMotion": exitMotion = "fade",
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: ColorPickerContentProps = $props();
</script>

<PopoverContent
  class={colorPickerContent({ "size": size, "class": cx(className) })}
  side={side}
  align={align}
  collisionStrategy={"best-fit"}
  exitMotion={exitMotion}
  portalContainer={portalContainer}
  disablePortal={disablePortal}
  {...rest}
  data-sw-color-picker-content={""}
  data-size={size}
  data-slot={"color-picker-content"}
>
  {#if children}{@render children()}{:else}<ColorPickerDefaultEditor
    size={size}
    showEyeDropper={showEyeDropper}
    portalContainer={portalContainer}
    disablePortal={disablePortal}
    formatControl={formatControl}
    formats={formats}
    swatches={swatches}
  >

  </ColorPickerDefaultEditor>{/if}
</PopoverContent>
