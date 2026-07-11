import { tv } from "tailwind-variants";

export const progress = tv({
  base: "bg-muted h-2 w-full overflow-hidden rounded-full",
  variants: {
    variant: {
      indeterminate: "relative",
    },
  },
});

export const progressTrack = tv({
  base: "h-full w-full",
});

export const progressIndicator = tv({
  base: "h-full w-full flex-1 transition-transform",
  variants: {
    variant: {
      indeterminate: "absolute inset-y-0 start-0 w-3/4",
    },
    color: {
      primary: "bg-primary",
      secondary: "bg-secondary",
      default: "bg-foreground",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});
