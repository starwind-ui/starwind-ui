import ColorPicker from "./ColorPicker.svelte";
import ColorPickerArea from "./ColorPickerArea.svelte";
import ColorPickerChannelInput from "./ColorPickerChannelInput.svelte";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider.svelte";
import ColorPickerClear from "./ColorPickerClear.svelte";
import ColorPickerContent from "./ColorPickerContent.svelte";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper.svelte";
import ColorPickerInput from "./ColorPickerInput.svelte";
import ColorPickerSwatch from "./ColorPickerSwatch.svelte";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup.svelte";
import ColorPickerTrigger from "./ColorPickerTrigger.svelte";
import ColorPickerValueSwatch from "./ColorPickerValueSwatch.svelte";
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
} from "./variants.js";

export type { ColorPickerProps } from "./ColorPicker.svelte";
export type { ColorPickerAreaProps } from "./ColorPickerArea.svelte";
export type { ColorPickerChannelInputProps } from "./ColorPickerChannelInput.svelte";
export type { ColorPickerChannelSliderProps } from "./ColorPickerChannelSlider.svelte";
export type { ColorPickerClearProps } from "./ColorPickerClear.svelte";
export type { ColorPickerContentProps } from "./ColorPickerContent.svelte";
export type { ColorPickerDefaultEditorProps } from "./ColorPickerDefaultEditor.svelte";
export type { ColorPickerEyeDropperProps } from "./ColorPickerEyeDropper.svelte";
export type { ColorPickerInputProps } from "./ColorPickerInput.svelte";
export type { ColorPickerSwatchProps } from "./ColorPickerSwatch.svelte";
export type { ColorPickerSwatchGroupProps } from "./ColorPickerSwatchGroup.svelte";
export type { ColorPickerTriggerProps } from "./ColorPickerTrigger.svelte";
export type { ColorPickerValueSwatchProps } from "./ColorPickerValueSwatch.svelte";

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
