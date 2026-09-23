<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { ColorPickerArea } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerAreaBackground } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerAreaThumb } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerAreaInput } from "@starwind-ui/svelte/color-picker";
  import "./styles.css";

  export type ColorPickerAreaProps = ComponentProps<typeof ColorPickerArea> & {children?:Snippet;  };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ColorPickerAreaProps = $props();
</script>

<ColorPickerArea
  class={colorPickerArea({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-area"}
>
  <ColorPickerAreaBackground
    class={"pointer-events-none absolute inset-0 size-full"}
    data-slot={"color-picker-area-background"}
  >

  </ColorPickerAreaBackground>
  <ColorPickerAreaThumb
    class={colorPickerAreaThumb({  })}
    data-slot={"color-picker-area-thumb"}
  >

  </ColorPickerAreaThumb>
  <ColorPickerAreaInput
    axis={"x"}
    class={"pointer-events-none absolute inset-0 size-full opacity-0"}
    data-slot={"color-picker-area-input-x"}
  >

  </ColorPickerAreaInput>
  <ColorPickerAreaInput
    axis={"y"}
    class={"pointer-events-none absolute inset-0 size-full opacity-0"}
    data-slot={"color-picker-area-input-y"}
  >

  </ColorPickerAreaInput>
</ColorPickerArea>
