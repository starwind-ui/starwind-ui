import { tv } from "tailwind-variants";
import { input as channelInputRecipe, input as valueInputRecipe } from "../input/variants";
import {
  nativeSelectIcon as nativeSelectIconRecipe,
  nativeSelect as nativeSelectRecipe,
  nativeSelectWrapper as nativeSelectWrapperRecipe,
} from "../native-select/variants";

export const colorPickerChannelInput = channelInputRecipe;

export const colorPickerValueInput = valueInputRecipe;

export const colorPickerNativeFormatSelectWrapper = nativeSelectWrapperRecipe;

export const colorPickerNativeFormatSelect = nativeSelectRecipe;

export const colorPickerNativeFormatSelectIcon = nativeSelectIconRecipe;

export const colorPicker = tv({
  base: "relative flex flex-col gap-(--sw-color-picker-gap) text-(length:--sw-color-picker-font-size)",
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerLabel = tv({
  base: "text-(length:--sw-color-picker-label-font-size) leading-none font-medium data-disabled:cursor-not-allowed data-disabled:opacity-50",
});

export const colorPickerControl = tv({
  base: "flex items-center gap-(--sw-color-picker-compact-gap)",
});

export const colorPickerTrigger = tv({
  base: "border-input bg-background focus-visible:ring-outline/50 inline-flex h-(--sw-color-picker-control-height) items-center gap-(--sw-color-picker-compact-gap) rounded-md border px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) shadow-xs outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
});

export const colorPickerContent = tv({
  base: "flex max-h-(--sw-floating-available-height) w-(--sw-color-picker-content-width) flex-col gap-(--sw-color-picker-content-gap) p-(--sw-color-picker-content-padding) text-(length:--sw-color-picker-font-size)",
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerInput = tv({
  base: "flex items-center gap-(--sw-color-picker-compact-gap)",
});

export const colorPickerValueInputLayout = tv({
  base: "data-invalid:border-error data-invalid:focus-visible:ring-error/40 !h-(--sw-color-picker-control-height) min-w-0 flex-1 !px-(--sw-color-picker-control-padding) !text-(length:--sw-color-picker-font-size)",
});

export const colorPickerArea = tv({
  base: "group/color-picker-area border-outline relative h-(--sw-color-picker-area-height) min-h-32 w-full shrink-0 cursor-crosshair touch-none rounded-md border [&>[data-slot=color-picker-area-background]]:inset-0 [&>[data-slot=color-picker-area-background]]:size-full [&>[data-slot=color-picker-area-background]]:rounded-[7px]",
});

export const colorPickerAreaThumb = tv({
  base: "group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-outline/60 pointer-events-none absolute top-[clamp(1px,var(--sw-color-picker-area-y),calc(100%_-_1px))] left-[clamp(1px,var(--sw-color-picker-area-x),calc(100%_-_1px))] z-10 size-(--sw-color-picker-area-thumb-size) -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--sw-color-picker-area-thumb-color) shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-3 focus-visible:ring-3 data-disabled:opacity-50 data-dragging:scale-110",
});

export const colorPickerSliders = tv({
  base: "flex flex-col gap-(--sw-color-picker-slider-gap) px-2",
});

export const colorPickerSliderActionRow = tv({
  base: "flex items-center gap-(--sw-color-picker-compact-gap)",
});

export const colorPickerValueFormatRow = tv({
  base: "flex items-center gap-(--sw-color-picker-compact-gap)",
});

export const colorPickerSeparator = tv({
  base: "bg-border my-[calc(var(--sw-color-picker-compact-gap)/2)] h-px w-full",
});

export const colorPickerChannelSlider = tv({
  base: "group/color-picker-channel-slider bg-border relative h-(--sw-color-picker-slider-size) touch-none rounded-full data-[orientation=vertical]:h-(--sw-color-picker-slider-vertical-size) data-[orientation=vertical]:w-(--sw-color-picker-slider-size) [&>[data-slot=color-picker-channel-slider-track]]:inset-px [&>[data-slot=color-picker-channel-slider-track]]:size-auto [&>[data-slot=color-picker-transparency-grid]]:inset-px [&>[data-slot=color-picker-transparency-grid]]:size-auto",
});

export const colorPickerChannelSliderThumb = tv({
  base: "group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-outline/60 pointer-events-none absolute top-1/2 left-(--sw-color-picker-channel-position) z-10 size-(--sw-color-picker-slider-thumb-size) -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-3 group-data-[orientation=vertical]/color-picker-channel-slider:top-[calc(100%-var(--sw-color-picker-channel-position))] group-data-[orientation=vertical]/color-picker-channel-slider:left-1/2 data-disabled:opacity-50 data-dragging:scale-110",
});

export const colorPickerChannelInputLayout = tv({
  base: "data-invalid:border-error data-invalid:focus-visible:ring-error/40 h-(--sw-color-picker-control-height) w-(--sw-color-picker-input-width) px-(--sw-color-picker-control-padding) text-center text-(length:--sw-color-picker-font-size)",
});

export const colorPickerSwatch = tv({
  base: "relative size-(--sw-color-picker-swatch-size) overflow-hidden rounded-md border shadow-xs outline-none focus-visible:ring-3 data-disabled:opacity-50 data-selected:ring-2",
});

export const colorPickerSwatchGroup = tv({
  base: "flex flex-wrap gap-(--sw-color-picker-compact-gap)",
});

export const colorPickerValueSwatch = tv({
  base: "border-input relative size-(--sw-color-picker-value-swatch-size) shrink-0 overflow-hidden rounded-(--sw-color-picker-value-swatch-radius) border",
});

export const colorPickerFormatSelectTrigger = tv({
  base: "h-(--sw-color-picker-control-height) min-w-(--sw-color-picker-format-width) px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) uppercase",
});

export const colorPickerAction = tv({
  base: "border-input bg-background inline-flex h-(--sw-color-picker-control-height) items-center justify-center rounded-md border px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) outline-none focus-visible:ring-3 disabled:opacity-50",
});

export const colorPickerHiddenInput = tv({
  base: "sr-only",
});
