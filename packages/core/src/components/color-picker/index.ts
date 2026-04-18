import ColorPicker, { colorPicker } from "./ColorPicker.astro";
import type { ColorPickerChangeEvent } from "./ColorPickerTypes.ts";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, type ColorPickerChangeEvent, ColorPickerVariants };

export default ColorPicker;
