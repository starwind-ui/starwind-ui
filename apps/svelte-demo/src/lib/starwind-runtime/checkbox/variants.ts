import { tv } from "tailwind-variants";

export const checkboxWrapper = tv({
  base: "relative flex items-center space-x-2",
});

export const checkbox = tv({
  base: [
    "peer border-input bg-background dark:bg-input/30 relative flex shrink-0 items-center justify-center rounded-sm border",
    "transition-all focus-visible:ring-3",
    "after:absolute after:-inset-x-3 after:-inset-y-2",
    "outline-0 focus:ring-0 focus:ring-offset-0",
    "not-data-disabled:cursor-pointer data-disabled:cursor-not-allowed data-disabled:opacity-50",
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
  ],
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
    variant: {
      default:
        "data-checked:bg-foreground data-checked:border-foreground focus-visible:ring-outline/50 focus-visible:border-outline",
      primary:
        "data-checked:bg-primary data-checked:border-primary focus-visible:ring-primary/50 focus-visible:border-primary",
      secondary:
        "data-checked:bg-secondary data-checked:border-secondary focus-visible:ring-secondary/50 focus-visible:border-secondary",
      info: "data-checked:bg-info data-checked:border-info focus-visible:ring-info/50 focus-visible:border-info",
      success:
        "data-checked:bg-success data-checked:border-success focus-visible:ring-success/50 focus-visible:border-success",
      warning:
        "data-checked:bg-warning data-checked:border-warning focus-visible:ring-warning/50 focus-visible:border-warning",
      error:
        "data-checked:bg-error data-checked:border-error focus-visible:ring-error/50 focus-visible:border-error",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export const checkboxIndicator = tv({
  base: [
    "pointer-events-none grid place-content-center p-0.5 opacity-0 transition-opacity [&>svg]:size-full",
  ],
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
    variant: {
      default: "text-background",
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      info: "text-info-foreground",
      success: "text-success-foreground",
      warning: "text-warning-foreground",
      error: "text-error-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export const checkboxLabel = tv({
  base: "font-medium peer-not-data-disabled:cursor-pointer peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-70",
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
