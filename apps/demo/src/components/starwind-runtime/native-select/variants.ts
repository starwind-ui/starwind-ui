import { tv } from "tailwind-variants";

export const nativeSelectWrapper = tv({
  base: ["group/native-select relative w-fit has-[select:disabled]:opacity-50"],
});

export const nativeSelect = tv({
  base: [
    "border-input dark:bg-input/30 text-foreground ring-offset-background w-full rounded-md border bg-transparent shadow-xs",
    "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground appearance-none bg-none select-none",
    "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3 focus-visible:transition-none",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
  ],
  variants: {
    size: {
      sm: "h-9 ps-2 pe-8 text-sm",
      md: "h-11 ps-3 pe-9 text-base",
      lg: "h-12 ps-4 pe-10 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const nativeSelectIcon = tv({
  base: ["text-foreground pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-50"],
  variants: {
    size: {
      sm: "end-2 size-3.5",
      md: "end-3 size-4",
      lg: "end-4 size-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});
