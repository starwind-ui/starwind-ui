<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerChannelInput } from "@starwind-ui/svelte/color-picker";

  export type ColorPickerChannelInputProps = ComponentProps<typeof ColorPickerChannelInput> & {children?:Snippet; channel: import("@starwind-ui/svelte/color-picker").ColorPickerChannel; };
</script>

<script lang="ts">
  let {
    "channel": channel,
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerChannelInputProps = $props();
</script>

<ColorPickerChannelInput
  class={[colorPickerChannelInput({  }), colorPickerChannelInputLayout({  }), className].filter(Boolean).join(" ")}
  channel={channel}
  {...rest}
  data-slot={"color-picker-channel-input"}
>

</ColorPickerChannelInput>
