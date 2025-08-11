import { tv } from "tailwind-variants";

const avatarVariants = tv({
  base: "text-foreground bg-muted relative overflow-hidden rounded-full border-2",
  variants: {
    variant: {
      default: "border-border",
      primary: "border-primary",
      secondary: "border-secondary",
      info: "border-info",
      success: "border-success",
      warning: "border-warning",
      error: "border-error",
    },
    size: { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" },
  },
  defaultVariants: { variant: "default", size: "md" },
});
const avatarFallbackVariants = tv({
  base: "absolute inset-0.5 flex items-center justify-center rounded-full font-medium",
});
const avatarImageVariants = tv({ base: "relative z-1 h-full w-full object-cover" });

export { avatarVariants, avatarFallbackVariants, avatarImageVariants };
