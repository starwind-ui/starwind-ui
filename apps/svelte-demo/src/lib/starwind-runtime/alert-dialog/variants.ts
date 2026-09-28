import { tv } from "tailwind-variants";

export const alertDialogBackdrop = tv({
  base: [
    "fixed inset-0 z-50 hidden bg-black/50 duration-200",
    "data-starting-style:!animate-none data-starting-style:opacity-0",
    "data-[state=open]:animate-in fade-in",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
  ],
});

export const alertDialogContent = tv({
  base: [
    "bg-background space-y-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
    "fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
    "data-starting-style:!animate-none data-starting-style:opacity-0",
    "data-[state=open]:animate-in fade-in zoom-in-95 duration-200 will-change-transform",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
  ],
});

export const alertDialogDescription = tv({
  base: "text-muted-foreground",
});

export const alertDialogFooter = tv({
  base: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
});

export const alertDialogHeader = tv({
  base: "flex flex-col gap-2 text-center sm:text-left",
});

export const alertDialogTitle = tv({
  base: "font-heading text-xl font-semibold",
});

export const alertDialogAction = tv({
  base: "",
});

export const alertDialogActionAsChild = tv({
  base: [
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transition-all outline-none focus-visible:ring-3",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
  ],
  variants: {
    variant: {
      default: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50",
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50",
      secondary:
        "bg-secondary text-secondary-foreground focus-visible:ring-secondary/50 hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
      outline:
        "dark:border-input focus-visible:ring-outline/50 bg-background dark:bg-input/30 focus-visible:border-outline hover:bg-muted dark:hover:bg-input/50 hover:text-foreground border shadow-xs",
      ghost: "hover:bg-muted hover:text-foreground focus-visible:ring-outline/50",
      info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/50",
      success:
        "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/50",
      warning:
        "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/50",
      error: "bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error/50",
    },
    size: {
      sm: "h-9 px-4 text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3.5",
      md: "h-11 px-5 text-base has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-4.5",
      lg: "h-12 px-8 text-lg has-[>svg]:px-6 [&_svg:not([class*='size-'])]:size-5",
      "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
      icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5",
      "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export const alertDialogCancel = tv({
  base: "",
});

export const alertDialogCancelAsChild = tv({
  base: [
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transition-all outline-none focus-visible:ring-3",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
  ],
  variants: {
    variant: {
      default: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50",
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50",
      secondary:
        "bg-secondary text-secondary-foreground focus-visible:ring-secondary/50 hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
      outline:
        "dark:border-input focus-visible:ring-outline/50 bg-background dark:bg-input/30 focus-visible:border-outline hover:bg-muted dark:hover:bg-input/50 hover:text-foreground border shadow-xs",
      ghost: "hover:bg-muted hover:text-foreground focus-visible:ring-outline/50",
      info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/50",
      success:
        "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/50",
      warning:
        "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/50",
      error: "bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error/50",
    },
    size: {
      sm: "h-9 px-4 text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3.5",
      md: "h-11 px-5 text-base has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-4.5",
      lg: "h-12 px-8 text-lg has-[>svg]:px-6 [&_svg:not([class*='size-'])]:size-5",
      "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
      icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5",
      "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});
