"use client";

import ColorPicker from "./ColorPicker";
import ColorPickerArea from "./ColorPickerArea";
import ColorPickerChannelInput from "./ColorPickerChannelInput";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider";
import ColorPickerClear from "./ColorPickerClear";
import ColorPickerContent from "./ColorPickerContent";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper";
import ColorPickerInput from "./ColorPickerInput";
import ColorPickerSwatch from "./ColorPickerSwatch";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup";
import ColorPickerTrigger from "./ColorPickerTrigger";
import ColorPickerValueSwatch from "./ColorPickerValueSwatch";
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

const ColorPickerParts = {
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

export default ColorPickerParts;
