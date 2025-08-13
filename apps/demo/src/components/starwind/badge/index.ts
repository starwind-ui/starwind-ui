import { tv } from "tailwind-variants";

import Badge from "./Badge.astro";

const badgeVariants = tv({
  base: "starwind-badge starwind-transition-colors inline-flex items-center rounded-full font-semibold focus-visible:outline-2 focus-visible:outline-offset-2",
  variants: {
    variant: {
      default: "bg-foreground text-background",
      primary: "bg-primary text-primary-foreground focus-visible:outline-primary",
      secondary: "bg-secondary text-secondary-foreground focus-visible:outline-secondary",
      outline: "border-border focus-visible:outline-outline border",
      ghost: "bg-foreground/10 text-foreground focus-visible:outline-outline",
      info: "bg-info text-info-foreground focus-visible:outline-info",
      success: "bg-success text-success-foreground focus-visible:outline-success",
      warning: "bg-warning text-warning-foreground focus-visible:outline-warning",
      error: "bg-error text-error-foreground focus-visible:outline-error",
    },
    size: { sm: "px-2.5 py-0.5 text-xs", md: "px-3 py-0.5 text-sm", lg: "px-4 py-1 text-base" },
    isLink: { true: "cursor-pointer", false: "" },
  },
  compoundVariants: [
    { isLink: true, variant: "default", class: "hover:bg-foreground/80" },
    { isLink: true, variant: "primary", class: "hover:bg-primary/80" },
    { isLink: true, variant: "secondary", class: "hover:bg-secondary/80" },
    { isLink: true, variant: "outline", class: "hover:border-border/80" },
    { isLink: true, variant: "ghost", class: "hover:bg-foreground/7" },
    { isLink: true, variant: "info", class: "hover:bg-info/80" },
    { isLink: true, variant: "success", class: "hover:bg-success/80" },
    { isLink: true, variant: "warning", class: "hover:bg-warning/80" },
    { isLink: true, variant: "error", class: "hover:bg-error/80" },
  ],
  defaultVariants: { variant: "default", size: "md", isLink: false },
});

export { Badge, badgeVariants };

export default Badge;
