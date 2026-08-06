import { h } from "vue";

import {
  ColorPickerArea,
  ColorPickerAreaBackground,
  ColorPickerAreaInput,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderInput,
  ColorPickerChannelSliderThumb,
  ColorPickerChannelSliderTrack,
  ColorPickerClear,
  ColorPickerControl,
  ColorPickerEyeDropperTrigger,
  ColorPickerFormatControl,
  ColorPickerFormatSelect,
  ColorPickerHiddenInput,
  ColorPickerLabel,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTransparencyGrid,
  ColorPickerValueInput,
  ColorPickerValueSwatch,
  ColorPickerValueText,
} from "@starwind-ui/vue/color-picker";

export function colorPickerChildren() {
  return [
    h(ColorPickerLabel, null, () => "Color"),
    h(ColorPickerControl, null, () => [
      h(ColorPickerValueInput),
      h(ColorPickerValueSwatch),
      h(ColorPickerValueText),
      h(ColorPickerFormatControl, null, () =>
        h(ColorPickerFormatSelect, null, () => [
          h("option", { value: "hex" }, "Hex"),
          h("option", { value: "rgb" }, "RGB"),
          h("option", { value: "hsl" }, "HSL"),
          h("option", { value: "hsb" }, "HSB"),
        ]),
      ),
    ]),
    h(ColorPickerArea, null, () => [
      h(ColorPickerAreaBackground),
      h(ColorPickerAreaThumb),
      h(ColorPickerAreaInput, { axis: "x", "aria-label": "Saturation" }),
      h(ColorPickerAreaInput, { axis: "y", "aria-label": "Brightness" }),
    ]),
    channelSlider("hue"),
    channelSlider("alpha"),
    h(ColorPickerChannelInput, { channel: "red", "aria-label": "Red" }),
    h(ColorPickerSwatchGroup, null, () => [
      h(ColorPickerSwatch, { swatchValue: "#ff0000" }, () => "Red"),
      h(ColorPickerSwatch, { swatchValue: "#00ff00" }, () => "Green"),
    ]),
    h(ColorPickerTransparencyGrid),
    h(ColorPickerEyeDropperTrigger, null, () => "Pick"),
    h(ColorPickerClear, null, () => "Clear"),
    h(ColorPickerHiddenInput),
  ];
}

function channelSlider(channel: "alpha" | "hue") {
  return h(ColorPickerChannelSlider, { channel }, () => [
    h(ColorPickerChannelSliderTrack),
    h(ColorPickerChannelSliderThumb),
    h(ColorPickerChannelSliderInput, { "aria-label": channel }),
  ]);
}
