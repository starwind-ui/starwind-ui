import { tv } from "tailwind-variants";

export const radioGroup = tv({
  base: "disabled:cursor-not-allowed disabled:opacity-70",
  variants: {
    orientation: {
      vertical: "grid gap-3",
      horizontal: "flex flex-row items-center gap-3",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export const radioWrapper = tv({
  base: "relative isolate flex shrink-0",
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const radioItem = tv({
  base: [
    "group/radio peer relative z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full",
    "outline-none focus:outline-none focus-visible:outline-none",
    "data-disabled:cursor-not-allowed",
  ],
});

export const radioControl = tv({
  base: [
    "border-input bg-background dark:bg-input/30",
    "absolute inset-0 rounded-full border shadow-xs",
    "transition-[color,box-shadow]",
    "group-focus-visible/radio:ring-3",
    "group-data-disabled/radio:cursor-not-allowed group-data-disabled/radio:opacity-50",
    "group-data-error-visible/radio:border-error group-focus-visible/radio:group-data-error-visible/radio:ring-error/40",
    "flex items-center justify-center",
  ],
  variants: {
    variant: {
      default:
        "group-data-checked/radio:border-foreground [&>span>svg]:fill-foreground group-focus-visible/radio:ring-outline/50",
      primary:
        "group-data-checked/radio:border-primary [&>span>svg]:fill-primary group-focus-visible/radio:ring-primary/50",
      secondary:
        "group-data-checked/radio:border-secondary [&>span>svg]:fill-secondary group-focus-visible/radio:ring-secondary/50",
      info: "group-data-checked/radio:border-info [&>span>svg]:fill-info group-focus-visible/radio:ring-info/50",
      success:
        "group-data-checked/radio:border-success [&>span>svg]:fill-success group-focus-visible/radio:ring-success/50",
      warning:
        "group-data-checked/radio:border-warning [&>span>svg]:fill-warning group-focus-visible/radio:ring-warning/50",
      error:
        "group-data-checked/radio:border-error [&>span>svg]:fill-error group-focus-visible/radio:ring-error/50",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export const radioIndicator = tv({
  base: [
    "flex items-center justify-center",
    "opacity-0 transition-opacity data-checked:opacity-100",
    "[&>svg]:size-full [&>svg]:shrink-0",
  ],
  variants: {
    size: {
      sm: "size-2",
      md: "size-3",
      lg: "size-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});
