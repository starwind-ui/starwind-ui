import ColorPicker, { colorPicker } from "./ColorPicker.astro";
import type { ColorPickerChangeEvent } from "./ColorPickerTypes.ts";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, ColorPickerVariants, type ColorPickerChangeEvent };

export default ColorPicker;
