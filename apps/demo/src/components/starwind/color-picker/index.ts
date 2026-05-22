import ColorPicker from "./ColorPicker.astro";
import type { ColorPickerChangeEvent } from "./ColorPickerTypes.ts";
import { colorPicker } from "./variants";

const ColorPickerVariants = { colorPicker };

export { ColorPicker, type ColorPickerChangeEvent, ColorPickerVariants };

export default ColorPicker;
