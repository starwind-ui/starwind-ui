import { tv } from "tailwind-variants";

export const alert = tv({
  base: "text-foreground relative w-full rounded-lg border p-4",
  variants: {
    variant: {
      default: "bg-background dark:bg-input/30 [&>h5>svg]:text-foreground",
      primary: "border-primary bg-primary/7 [&>h5>svg]:text-primary",
      secondary: "border-secondary bg-secondary/7 [&>h5>svg]:text-secondary",
      info: "border-info bg-info/7 [&>h5>svg]:text-info",
      success: "border-success bg-success/7 [&>h5>svg]:text-success",
      warning: "border-warning bg-warning/7 [&>h5>svg]:text-warning",
      error: "border-error bg-error/7 [&>h5>svg]:text-error",
    },
  },
  defaultVariants: { variant: "default" },
});

export const alertDescription = tv({ base: "leading-relaxed" });

export const alertTitle = tv({
  base: "font-heading mb-2 flex items-center gap-2 text-lg leading-none font-medium tracking-tight",
});
