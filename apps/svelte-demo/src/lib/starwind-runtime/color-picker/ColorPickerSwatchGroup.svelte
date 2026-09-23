<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerSwatchGroup } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerSwatchGroupProps = ComponentProps<typeof ColorPickerSwatchGroup> & {children?:Snippet;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerSwatchGroupProps = $props();
</script>

<ColorPickerSwatchGroup
  class={colorPickerSwatchGroup({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-swatch-group"}
>
  {@render children?.()}
</ColorPickerSwatchGroup>
