import { tv } from "tailwind-variants";

export const avatar = tv({
  base: "text-foreground bg-muted relative inline-flex overflow-hidden rounded-full border-2",
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
    size: {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export const avatarFallback = tv({
  base: "absolute inset-0.5 flex items-center justify-center rounded-full font-medium",
});

export const avatarGroup = tv({
  base: [
    "group/avatar-group flex -space-x-2",
    "*:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2",
  ],
});

export const avatarGroupCount = tv({
  base: [
    "bg-muted text-muted-foreground ring-background relative flex size-10 shrink-0 items-center justify-center rounded-full text-sm ring-2",
    "group-has-data-[size=lg]/avatar-group:size-12 group-has-data-[size=sm]/avatar-group:size-8",
    "[&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
  ],
});

export const avatarImage = tv({
  base: "relative z-1 h-full w-full object-cover",
});
