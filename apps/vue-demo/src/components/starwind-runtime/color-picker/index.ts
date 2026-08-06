import ColorPicker from "./ColorPicker.vue";
import ColorPickerArea from "./ColorPickerArea.vue";
import ColorPickerChannelInput from "./ColorPickerChannelInput.vue";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider.vue";
import ColorPickerClear from "./ColorPickerClear.vue";
import ColorPickerContent from "./ColorPickerContent.vue";
import ColorPickerDefaultEditor from "./ColorPickerDefaultEditor.vue";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper.vue";
import ColorPickerInput from "./ColorPickerInput.vue";
import ColorPickerSwatch from "./ColorPickerSwatch.vue";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup.vue";
import ColorPickerTrigger from "./ColorPickerTrigger.vue";
import ColorPickerValueSwatch from "./ColorPickerValueSwatch.vue";
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

export type { ColorPickerProps } from "./ColorPicker.vue";
export type { ColorPickerAreaProps } from "./ColorPickerArea.vue";
export type { ColorPickerChannelInputProps } from "./ColorPickerChannelInput.vue";
export type { ColorPickerChannelSliderProps } from "./ColorPickerChannelSlider.vue";
export type { ColorPickerClearProps } from "./ColorPickerClear.vue";
export type { ColorPickerContentProps } from "./ColorPickerContent.vue";
export type { ColorPickerDefaultEditorProps } from "./ColorPickerDefaultEditor.vue";
export type { ColorPickerEyeDropperProps } from "./ColorPickerEyeDropper.vue";
export type { ColorPickerInputProps } from "./ColorPickerInput.vue";
export type { ColorPickerSwatchProps } from "./ColorPickerSwatch.vue";
export type { ColorPickerSwatchGroupProps } from "./ColorPickerSwatchGroup.vue";
export type { ColorPickerTriggerProps } from "./ColorPickerTrigger.vue";
export type { ColorPickerValueSwatchProps } from "./ColorPickerValueSwatch.vue";

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
