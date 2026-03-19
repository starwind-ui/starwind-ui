import ColorPicker, { colorPicker } from "./ColorPicker.astro";
import type { ColorPickerEvent, ColorPickerChangeEvent } from "./ColorPickerTypes";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, ColorPickerVariants, type ColorPickerEvent, type ColorPickerChangeEvent };

export default ColorPicker;
