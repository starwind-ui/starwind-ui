import ColorPicker, { colorPicker } from "./ColorPicker.astro";
import type { ColorPickerEvent, ColorPickerChangeEvent } from "./ColorPickerTypes.ts";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, ColorPickerVariants, type ColorPickerEvent, type ColorPickerChangeEvent };

export default ColorPicker;
