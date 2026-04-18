import ColorPicker, { colorPicker } from "./ColorPicker.astro";
import type { ColorPickerChangeEvent } from "./ColorPickerTypes";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, type ColorPickerChangeEvent,ColorPickerVariants };

export default ColorPicker;
