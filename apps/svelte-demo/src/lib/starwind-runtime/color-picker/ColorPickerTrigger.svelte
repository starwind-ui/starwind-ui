<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { PopoverTrigger } from "@starwind-ui/svelte/popover";
  import { ColorPickerValueSwatch } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerTransparencyGrid } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerValueText } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerTriggerProps = ComponentProps<typeof PopoverTrigger> & {children?:Snippet; showValueText?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    "showValueText": showValueText = true,
    "children": children,
    ...rest
  }: ColorPickerTriggerProps = $props();
</script>

<PopoverTrigger
  class={colorPickerTrigger({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-trigger"}
>
  {@render children?.()}
  <ColorPickerValueSwatch
    class={colorPickerValueSwatch({  })}
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
  {#if showValueText}
    <ColorPickerValueText
      data-slot={"color-picker-value-text"}
    >

    </ColorPickerValueText>
  {/if}
</PopoverTrigger>
