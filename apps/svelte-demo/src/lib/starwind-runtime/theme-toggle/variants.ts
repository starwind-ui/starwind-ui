import { tv } from "tailwind-variants";

export const themeToggle = tv({
  base: [
    "group inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "data-[state=on]:bg-muted data-[state=on]:text-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:ring-3",
    "transition-colors outline-none",
    "aria-invalid:ring-error/40 aria-invalid:border-error",
    "hover:border-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent",
  ],
  variants: {
    variant: {
      default: "hover:bg-muted hover:text-foreground bg-transparent",
      outline: "border-input hover:bg-muted hover:text-foreground border bg-transparent shadow-xs",
    },
    size: {
      sm: "h-9 min-w-9 px-2 text-sm",
      md: "h-11 min-w-11 px-2.5 text-base",
      lg: "h-12 min-w-12 px-3 text-lg",
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});
