import ColorPicker from "./ColorPicker.astro";
import ColorPickerArea from "./ColorPickerArea.astro";
import ColorPickerChannelInput from "./ColorPickerChannelInput.astro";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider.astro";
import ColorPickerClear from "./ColorPickerClear.astro";
import ColorPickerContent from "./ColorPickerContent.astro";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper.astro";
import ColorPickerInput from "./ColorPickerInput.astro";
import ColorPickerSwatch from "./ColorPickerSwatch.astro";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup.astro";
import ColorPickerTrigger from "./ColorPickerTrigger.astro";
import ColorPickerValueSwatch from "./ColorPickerValueSwatch.astro";
import {
  colorPicker,
  colorPickerAction,
  colorPickerArea,
  colorPickerAreaThumb,
  colorPickerChannelInput,
  colorPickerChannelInputLayout,
  colorPickerChannelSlider,
  colorPickerChannelSliderThumb,
  colorPickerContent,
  colorPickerControl,
  colorPickerFormatSelectTrigger,
  colorPickerHiddenInput,
  colorPickerInput,
  colorPickerLabel,
  colorPickerNativeFormatSelect,
  colorPickerNativeFormatSelectIcon,
  colorPickerNativeFormatSelectWrapper,
  colorPickerSeparator,
  colorPickerSliderActionRow,
  colorPickerSliders,
  colorPickerSwatch,
  colorPickerSwatchGroup,
  colorPickerTrigger,
  colorPickerValueFormatRow,
  colorPickerValueInput,
  colorPickerValueInputLayout,
  colorPickerValueSwatch,
} from "./variants";

const ColorPickerVariants = {
  colorPicker,
  colorPickerAction,
  colorPickerArea,
  colorPickerAreaThumb,
  colorPickerChannelInput,
  colorPickerChannelInputLayout,
  colorPickerChannelSlider,
  colorPickerChannelSliderThumb,
  colorPickerContent,
  colorPickerControl,
  colorPickerFormatSelectTrigger,
  colorPickerHiddenInput,
  colorPickerInput,
  colorPickerLabel,
  colorPickerNativeFormatSelect,
  colorPickerNativeFormatSelectIcon,
  colorPickerNativeFormatSelectWrapper,
  colorPickerSeparator,
  colorPickerSliderActionRow,
  colorPickerSliders,
  colorPickerSwatch,
  colorPickerSwatchGroup,
  colorPickerTrigger,
  colorPickerValueFormatRow,
  colorPickerValueInput,
  colorPickerValueInputLayout,
  colorPickerValueSwatch,
};

export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerChannelInput,
  ColorPickerChannelSlider,
  ColorPickerClear,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTrigger,
  ColorPickerValueSwatch,
  ColorPickerVariants,
};

export default {
  Root: ColorPicker,
  Input: ColorPickerInput,
  Trigger: ColorPickerTrigger,
  Content: ColorPickerContent,
  Area: ColorPickerArea,
  ChannelSlider: ColorPickerChannelSlider,
  ChannelInput: ColorPickerChannelInput,
  ValueSwatch: ColorPickerValueSwatch,
  SwatchGroup: ColorPickerSwatchGroup,
  Swatch: ColorPickerSwatch,
  EyeDropper: ColorPickerEyeDropper,
  Clear: ColorPickerClear,
};
