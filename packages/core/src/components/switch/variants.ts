import { tv } from "tailwind-variants";

export const switchButton = tv({
  base: [
    "border-input bg-muted inline-flex h-(--height) w-(--width) items-center rounded-full border",
    "group peer ring-offset-background transition outline-none focus-visible:ring-3",
    "not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
  ],
  variants: {
    variant: {
      primary: "aria-checked:border-primary focus-visible:border-primary/70 focus:ring-primary/50",
      secondary:
        "aria-checked:border-secondary focus-visible:border-secondary/70 focus:ring-secondary/50",
      default: "aria-checked:border-foreground focus-visible:border-outline focus:ring-outline/50",
      info: "aria-checked:border-info focus-visible:border-info/70 focus:ring-info/50",
      success: "aria-checked:border-success focus-visible:border-success/70 focus:ring-success/50",
      warning: "aria-checked:border-warning focus-visible:border-warning/70 focus:ring-warning/50",
      error: "aria-checked:border-error focus-visible:border-error/70 focus:ring-error/50",
    },
  },
  defaultVariants: { variant: "default" },
});

export const switchToggle = tv({
  base: [
    "bg-foreground inline-block transform rounded-full transition-transform",
    "group-aria-checked:translate-x-(--translation) group-aria-[checked=false]:translate-x-[calc(var(--padding)-var(--border-offset))]",
  ],
  variants: { size: { sm: "size-4", md: "size-5", lg: "size-6" } },
  defaultVariants: { size: "md" },
});

export const switchLabel = tv({
  base: "text-foreground ml-2 font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  variants: { size: { sm: "text-sm", md: "text-base", lg: "text-lg" } },
  defaultVariants: { size: "md" },
});
