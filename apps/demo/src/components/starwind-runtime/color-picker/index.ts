import ColorPicker from "./ColorPicker.astro";
import ColorPickerArea from "./ColorPickerArea.astro";
import ColorPickerAreaThumb from "./ColorPickerAreaThumb.astro";
import ColorPickerChannelInput from "./ColorPickerChannelInput.astro";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider.astro";
import ColorPickerClear from "./ColorPickerClear.astro";
import ColorPickerContent from "./ColorPickerContent.astro";
import ColorPickerControl from "./ColorPickerControl.astro";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper.astro";
import ColorPickerFormatSelect from "./ColorPickerFormatSelect.astro";
import ColorPickerHiddenInput from "./ColorPickerHiddenInput.astro";
import ColorPickerInput from "./ColorPickerInput.astro";
import ColorPickerLabel from "./ColorPickerLabel.astro";
import ColorPickerNativeFormatSelect from "./ColorPickerNativeFormatSelect.astro";
import ColorPickerRoot from "./ColorPickerRoot.astro";
import ColorPickerSliders from "./ColorPickerSliders.astro";
import ColorPickerSwatch from "./ColorPickerSwatch.astro";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup.astro";
import ColorPickerTrigger from "./ColorPickerTrigger.astro";
import ColorPickerValueInput from "./ColorPickerValueInput.astro";
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
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerChannelSlider,
  ColorPickerClear,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHiddenInput,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerNativeFormatSelect,
  ColorPickerRoot,
  ColorPickerSliders,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTrigger,
  ColorPickerValueInput,
  ColorPickerValueSwatch,
  ColorPickerVariants,
};

export default {
  Root: ColorPicker,
  InlineRoot: ColorPickerRoot,
  Label: ColorPickerLabel,
  Control: ColorPickerControl,
  Input: ColorPickerInput,
  Trigger: ColorPickerTrigger,
  Content: ColorPickerContent,
  Area: ColorPickerArea,
  AreaThumb: ColorPickerAreaThumb,
  Sliders: ColorPickerSliders,
  ChannelSlider: ColorPickerChannelSlider,
  ChannelInput: ColorPickerChannelInput,
  ValueInput: ColorPickerValueInput,
  NativeFormatSelect: ColorPickerNativeFormatSelect,
  FormatSelect: ColorPickerFormatSelect,
  ValueSwatch: ColorPickerValueSwatch,
  SwatchGroup: ColorPickerSwatchGroup,
  Swatch: ColorPickerSwatch,
  EyeDropper: ColorPickerEyeDropper,
  Clear: ColorPickerClear,
  HiddenInput: ColorPickerHiddenInput,
};
