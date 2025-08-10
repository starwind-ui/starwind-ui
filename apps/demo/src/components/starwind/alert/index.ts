import Alert from "./Alert.astro";
import AlertDescription from "./AlertDescription.astro";
import AlertTitle from "./AlertTitle.astro";
import { tv } from "tailwind-variants";


const alertVariants = tv({
  base: "text-foreground relative w-full rounded-lg border p-4",
  variants: {
    variant: {
      default: "bg-background [&>h5>svg]:text-foreground",
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

export { Alert, AlertDescription, AlertTitle, alertVariants };

export default {
  Root: Alert,
  Description: AlertDescription,
  Title: AlertTitle,
};
