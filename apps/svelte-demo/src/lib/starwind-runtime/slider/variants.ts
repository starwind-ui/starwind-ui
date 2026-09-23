import { tv } from "tailwind-variants";

export const slider = tv({
  base: "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
});

export const sliderControl = tv({
  base: "relative w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
});

export const sliderTrack = tv({
  base: "bg-muted relative overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
});

export const sliderRange = tv({
  base: "data-error-visible:bg-error absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
  variants: {
    variant: {
      default: "bg-foreground",
      primary: "bg-primary",
      secondary: "bg-secondary",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const sliderThumb = tv({
  base: [
    "absolute block size-4 shrink-0 rounded-full border bg-white shadow-sm",
    "transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden",
    "data-error-visible:border-error data-error-visible:ring-error/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[orientation=horizontal]:top-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=horizontal]:-translate-y-1/2",
    "data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:translate-y-1/2",
  ],
  variants: {
    variant: {
      default: "border-foreground ring-outline/50",
      primary: "border-primary ring-primary/50",
      secondary: "border-secondary ring-secondary/50",
      info: "border-info ring-info/50",
      success: "border-success ring-success/50",
      warning: "border-warning ring-warning/50",
      error: "border-error ring-error/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
