<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerEyeDropperTrigger } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerEyeDropperProps = ComponentProps<typeof ColorPickerEyeDropperTrigger> & {children?:Snippet;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerEyeDropperProps = $props();
</script>

<ColorPickerEyeDropperTrigger
  class={colorPickerAction({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-eye-dropper"}
>
  {@render children?.()}
</ColorPickerEyeDropperTrigger>
