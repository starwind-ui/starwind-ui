<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerChannelSlider } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerTransparencyGrid } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerChannelSliderTrack } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerChannelSliderThumb } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerChannelSliderInput } from "@starwind-ui/svelte/color-picker";
  import "./styles.css";

  export type ColorPickerChannelSliderProps = ComponentProps<typeof ColorPickerChannelSlider> & {children?:Snippet; channel: import("@starwind-ui/svelte/color-picker").ColorPickerChannel; orientation?: "horizontal" | "vertical"; };
</script>

<script lang="ts">
  let {
    "channel": channel,
    "orientation": orientation = "horizontal",
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerChannelSliderProps = $props();
</script>

<ColorPickerChannelSlider
  channel={channel}
  orientation={orientation}
  class={colorPickerChannelSlider({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-channel-slider"}
>
  <ColorPickerTransparencyGrid
    class={"pointer-events-none absolute inset-0 size-full rounded-[inherit]"}
    data-slot={"color-picker-transparency-grid"}
  >

  </ColorPickerTransparencyGrid>
  <ColorPickerChannelSliderTrack
    class={"pointer-events-none absolute inset-0 size-full rounded-[inherit]"}
    data-slot={"color-picker-channel-slider-track"}
  >

  </ColorPickerChannelSliderTrack>
  <ColorPickerChannelSliderThumb
    class={colorPickerChannelSliderThumb({  })}
    data-slot={"color-picker-channel-slider-thumb"}
  >
    <span
      class={"pointer-events-none absolute inset-0 size-full"}
      data-slot={"color-picker-transparency-grid"}
    >

    </span>
    <span
      class={"pointer-events-none absolute inset-0 size-full bg-(--sw-color-picker-channel-thumb-color)"}
      data-slot={"color-picker-channel-thumb-color-layer"}
    >

    </span>
  </ColorPickerChannelSliderThumb>
  <ColorPickerChannelSliderInput
    class={"absolute inset-0 size-full cursor-pointer opacity-0"}
    data-slot={"color-picker-channel-slider-input"}
  >

  </ColorPickerChannelSliderInput>
</ColorPickerChannelSlider>
