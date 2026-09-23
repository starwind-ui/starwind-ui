<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerClear } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerClearProps = ComponentProps<typeof ColorPickerClear> & {children?:Snippet;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerClearProps = $props();
</script>

<ColorPickerClear
  class={colorPickerAction({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-clear"}
>
  {@render children?.()}
</ColorPickerClear>
