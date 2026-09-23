<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerValueSwatch } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerTransparencyGrid } from "@starwind-ui/svelte/color-picker";
  import "./styles.css";

  export type ColorPickerValueSwatchProps = ComponentProps<typeof ColorPickerValueSwatch> & {children?:Snippet;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerValueSwatchProps = $props();
</script>

<ColorPickerValueSwatch
  class={colorPickerValueSwatch({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-value-swatch"}
>
  <ColorPickerTransparencyGrid
    class={"pointer-events-none absolute inset-0 size-full"}
    data-slot={"color-picker-transparency-grid"}
  >

  </ColorPickerTransparencyGrid>
  <span
    class={"pointer-events-none absolute inset-0 size-full"}
    data-slot={"color-picker-value-swatch-color"}
  >

  </span>
</ColorPickerValueSwatch>
