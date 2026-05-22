import { tv } from "tailwind-variants";

export const checkbox = tv({
  slots: {
    base: "starwind-checkbox relative flex items-center space-x-2",
    input: [
      "peer border-input bg-background dark:bg-input/30 shrink-0 transform-gpu rounded-sm border",
      "transition-all focus-visible:ring-3",
      "outline-0 focus:ring-0 focus:ring-offset-0",
      "not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
    ],
    icon: [
      "pointer-events-none absolute stroke-3 p-0.5 opacity-0 transition-opacity peer-checked:opacity-100",
      "starwind-check-icon",
    ],
    label:
      "font-medium peer-not-disabled:cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  },
  variants: {
    size: {
      sm: { input: "size-4", icon: "size-4", label: "text-sm" },
      md: { input: "size-5", icon: "size-5", label: "text-base" },
      lg: { input: "size-6", icon: "size-6", label: "text-lg" },
    },
    variant: {
      default: {
        input: "checked:bg-foreground focus-visible:ring-outline/50 focus-visible:border-outline",
        icon: "text-background",
      },
      primary: {
        input:
          "checked:bg-primary checked:border-primary focus-visible:ring-primary/50 focus-visible:border-primary",
        icon: "text-primary-foreground",
      },
      secondary: {
        input:
          "checked:bg-secondary checked:border-secondary focus-visible:ring-secondary/50 focus-visible:border-secondary",
        icon: "text-secondary-foreground",
      },
      info: {
        input:
          "checked:bg-info checked:border-info focus-visible:ring-info/50 focus-visible:border-info",
        icon: "text-info-foreground",
      },
      success: {
        input:
          "checked:bg-success checked:border-success focus-visible:ring-success/50 focus-visible:border-success",
        icon: "text-success-foreground",
      },
      warning: {
        input:
          "checked:bg-warning checked:border-warning focus-visible:ring-warning/50 focus-visible:border-warning",
        icon: "text-warning-foreground",
      },
      error: {
        input:
          "checked:bg-error checked:border-error focus-visible:ring-error/50 focus-visible:border-error",
        icon: "text-error-foreground",
      },
    },
  },
  defaultVariants: { size: "md", variant: "default" },
});
