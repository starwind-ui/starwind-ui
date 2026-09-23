<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerSwatch } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerTransparencyGrid } from "@starwind-ui/svelte/color-picker";
  import "./styles.css";

  export type ColorPickerSwatchProps = Omit<ComponentProps<typeof ColorPickerSwatch>, "value" | "swatchValue" | "swatchDisabled" | "disabled"> & {children?:Snippet; value: import("@starwind-ui/svelte/color-picker").ColorPickerValue; disabled?: boolean; };
</script>

<script lang="ts">
  let {
    "value": value,
    "disabled": disabled = false,
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerSwatchProps = $props();
</script>

<ColorPickerSwatch
  swatchValue={value}
  swatchDisabled={disabled}
  class={colorPickerSwatch({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-swatch"}
>
  <ColorPickerTransparencyGrid
    class={"pointer-events-none absolute inset-0 size-full"}
    data-slot={"color-picker-transparency-grid"}
  >

  </ColorPickerTransparencyGrid>
  <span
    class={"pointer-events-none absolute inset-0 size-full"}
    data-slot={"color-picker-swatch-color"}
  >

  </span>
  {@render children?.()}
</ColorPickerSwatch>
