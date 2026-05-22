import { tv } from "tailwind-variants";

export const slider = tv({
  slots: {
    root: "starwind-slider relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
    control:
      "starwind-slider-control relative w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto",
    track:
      "starwind-slider-track bg-muted relative overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
    range:
      "starwind-slider-range absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
    thumb:
      "starwind-slider-thumb absolute block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[orientation=horizontal]:top-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=horizontal]:-translate-y-1/2 data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:translate-y-1/2",
  },
  variants: {
    variant: {
      default: {
        range: "bg-foreground",
        thumb: "border-foreground ring-outline/50",
      },
      primary: {
        range: "bg-primary",
        thumb: "border-primary ring-primary/50",
      },
      secondary: {
        range: "bg-secondary",
        thumb: "border-secondary ring-secondary/50",
      },
      info: {
        range: "bg-info",
        thumb: "border-info ring-info/50",
      },
      success: {
        range: "bg-success",
        thumb: "border-success ring-success/50",
      },
      warning: {
        range: "bg-warning",
        thumb: "border-warning ring-warning/50",
      },
      error: {
        range: "bg-error",
        thumb: "border-error ring-error/50",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
