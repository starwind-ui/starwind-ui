import { tv } from "tailwind-variants";

export const toastDescription = tv({
  base: "starwind-toast-description text-muted-foreground text-sm",
});

export const toastViewport = tv({
  base: [
    "starwind-toast-viewport fixed z-50 flex w-80 outline-none",
    "data-[position=bottom-center]:bottom-4 data-[position=bottom-center]:left-1/2 data-[position=bottom-center]:-translate-x-1/2",
    "data-[position=bottom-left]:bottom-4 data-[position=bottom-left]:left-4",
    "data-[position=bottom-right]:right-4 data-[position=bottom-right]:bottom-4",
    "data-[position=top-center]:top-4 data-[position=top-center]:left-1/2 data-[position=top-center]:-translate-x-1/2",
    "data-[position=top-left]:top-4 data-[position=top-left]:left-4",
    "data-[position=top-right]:top-4 data-[position=top-right]:right-4",
  ],
});

export const toastItem = tv({
  base: "starwind-toast bg-popover text-popover-foreground pointer-events-auto absolute inset-x-0 bottom-0 flex w-full origin-bottom flex-col gap-1 overflow-hidden rounded-lg border bg-clip-padding p-4 pr-10 shadow-lg transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-limited:pointer-events-none data-limited:opacity-0",
  variants: {
    variant: {
      default: "border-border",
      success: "border-success/80",
      error: "border-error/80",
      warning: "border-warning/80",
      info: "border-info/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const toastTitle = tv({
  base: "starwind-toast-title flex items-center gap-1 text-sm font-semibold [&_svg]:size-4",
  variants: {
    variant: {
      default: "",
      success: "[&_svg]:text-success",
      error: "[&_svg]:text-error",
      warning: "[&_svg]:text-warning",
      info: "[&_svg]:text-info",
      loading: "[&_svg]:text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
