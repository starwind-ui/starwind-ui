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
  base: "relative flex flex-col gap-3",
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerLabel = tv({
  base: "leading-none font-medium data-disabled:cursor-not-allowed data-disabled:opacity-50",
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerControl = tv({
  base: "flex items-center gap-2",
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerTrigger = tv({
  base: "border-input bg-background focus-visible:ring-outline/50 inline-flex items-center rounded-md border shadow-xs outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    size: {
      sm: "h-9 gap-2 px-2 text-sm",
      md: "h-11 gap-2.5 px-3",
      lg: "h-12 gap-3 px-4 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerContent = tv({
  base: "flex max-h-[max(10rem,var(--sw-floating-available-height))] w-72 flex-col gap-3 p-3",
  variants: {
    size: {
      sm: "w-64 gap-2 p-2",
      md: "w-72 gap-3 p-3",
      lg: "w-80 gap-4 p-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerInput = tv({
  base: "flex items-center gap-2",
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerValueInputLayout = tv({
  base: "data-invalid:border-error data-invalid:focus-visible:ring-error/40 min-w-0 flex-1",
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

export const colorPickerArea = tv({
  base: "group/color-picker-area border-outline relative w-full touch-none rounded-md border [&>[data-slot=color-picker-area-background]]:inset-0 [&>[data-slot=color-picker-area-background]]:size-full [&>[data-slot=color-picker-area-background]]:rounded-[7px]",
  variants: {
    size: {
      sm: "h-[150px]",
      md: "h-[175px]",
      lg: "h-[200px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerAreaThumb = tv({
  base: "group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-outline/60 pointer-events-none absolute top-[clamp(1px,var(--sw-color-picker-area-y),calc(100%_-_1px))] left-[clamp(1px,var(--sw-color-picker-area-x),calc(100%_-_1px))] z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--sw-color-picker-area-thumb-color)] shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-3 focus-visible:ring-3 data-disabled:opacity-50 data-dragging:scale-110",
  variants: {
    size: {
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerSliders = tv({
  base: "flex flex-col gap-3 px-2",
  variants: {
    size: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerSliderActionRow = tv({
  base: "flex items-center gap-2",
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerValueFormatRow = tv({
  base: "flex items-center gap-2",
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerSeparator = tv({
  base: "bg-border h-px w-full",
  variants: {
    size: {
      sm: "my-0.5",
      md: "my-1",
      lg: "my-1.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerChannelSlider = tv({
  base: "group/color-picker-channel-slider bg-border relative touch-none rounded-full [&>[data-slot=color-picker-channel-slider-track]]:inset-px [&>[data-slot=color-picker-channel-slider-track]]:size-auto [&>[data-slot=color-picker-transparency-grid]]:inset-px [&>[data-slot=color-picker-transparency-grid]]:size-auto",
  variants: {
    size: {
      sm: "h-2.5 data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-2.5",
      md: "h-3 data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-3",
      lg: "h-4 data-[orientation=vertical]:h-56 data-[orientation=vertical]:w-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerChannelSliderThumb = tv({
  base: "group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-outline/60 pointer-events-none absolute top-1/2 left-[var(--sw-color-picker-channel-position)] z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-3 group-data-[orientation=vertical]/color-picker-channel-slider:top-[calc(100%-var(--sw-color-picker-channel-position))] group-data-[orientation=vertical]/color-picker-channel-slider:left-1/2 data-disabled:opacity-50 data-dragging:scale-110",
  variants: {
    size: {
      sm: "size-3",
      md: "size-4",
      lg: "size-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerChannelInputLayout = tv({
  base: "data-invalid:border-error data-invalid:focus-visible:ring-error/40 text-center",
  variants: {
    size: {
      sm: "h-9 w-16 text-sm",
      md: "h-11 w-20",
      lg: "h-12 w-24 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerSwatch = tv({
  base: "relative overflow-hidden rounded-md border shadow-xs outline-none focus-visible:ring-3 data-disabled:opacity-50 data-selected:ring-2",
  variants: {
    size: {
      sm: "size-6",
      md: "size-7",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerSwatchGroup = tv({
  base: "flex flex-wrap gap-2",
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerValueSwatch = tv({
  base: "border-input relative shrink-0 overflow-hidden border",
  variants: {
    size: {
      sm: "size-4 rounded-[4.5px]",
      md: "size-5 rounded-[5.5px]",
      lg: "size-6 rounded-[6.5px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerFormatSelectTrigger = tv({
  base: "uppercase",
  variants: {
    size: {
      sm: "min-w-20",
      md: "min-w-24",
      lg: "min-w-24",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerAction = tv({
  base: "border-input bg-background inline-flex items-center justify-center rounded-md border outline-none focus-visible:ring-3 disabled:opacity-50",
  variants: {
    size: {
      sm: "h-9 px-2 text-sm",
      md: "h-11 px-3",
      lg: "h-12 px-4 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const colorPickerHiddenInput = tv({
  base: "sr-only",
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
