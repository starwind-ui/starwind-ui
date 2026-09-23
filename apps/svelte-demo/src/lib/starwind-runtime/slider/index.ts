import Slider from "./Slider.svelte";
import { slider, sliderControl, sliderRange, sliderThumb, sliderTrack } from "./variants.js";
export type { SliderProps } from "./Slider.svelte";
const SliderVariants = { slider, sliderControl, sliderRange, sliderThumb, sliderTrack };
export { Slider, SliderVariants };
export default Slider;
