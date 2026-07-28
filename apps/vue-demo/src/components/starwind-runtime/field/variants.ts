import { tv } from "tailwind-variants";

export const field = tv({
  base: "group/field min-w-0",
  variants: {
    orientation: {
      horizontal: "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1",
      responsive:
        "flex flex-col gap-2 sm:grid sm:grid-cols-[auto_1fr] sm:items-start sm:gap-x-3 sm:gap-y-1",
      vertical: "flex flex-col gap-2",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export const fieldContent = tv({
  base: "flex min-w-0 flex-col gap-1.5",
});

export const fieldControl = tv({
  base: [
    "border-input dark:bg-input/30 text-foreground w-full rounded-md border bg-transparent shadow-xs",
    "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] focus-visible:ring-3 focus-visible:transition-none",
    "file:text-foreground file:my-auto file:mr-4 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
    "peer placeholder:text-muted-foreground",
  ],
  variants: {
    size: {
      sm: "h-9 px-2 text-sm",
      md: "h-11 px-3 text-base",
      lg: "h-12 px-4 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const fieldDescription = tv({
  base: "text-muted-foreground text-sm",
});

export const fieldError = tv({
  base: "text-error text-sm font-medium",
});

export const fieldGroup = tv({
  base: "group/field-group flex min-w-0 flex-col gap-6",
  variants: {
    variant: {
      default: "",
      outline: "rounded-md border p-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const fieldItem = tv({
  base: "flex items-start gap-3",
});

export const fieldLabel = tv({
  base: [
    "text-foreground leading-none font-medium",
    "data-invalid:text-error data-disabled:cursor-not-allowed data-disabled:opacity-70",
  ],
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const fieldLegend = tv({
  base: [
    "text-foreground font-medium",
    "data-disabled:cursor-not-allowed data-disabled:opacity-70",
  ],
  variants: {
    variant: {
      label: "text-sm leading-none",
      legend: "text-base",
    },
  },
  defaultVariants: {
    variant: "legend",
  },
});

export const fieldSeparator = tv({
  base: ["relative -my-2 h-5 text-sm", "group-data-[variant=outline]/field-group:-mb-2"],
});

export const fieldSeparatorContent = tv({
  base: ["bg-background text-muted-foreground", "relative mx-auto block w-fit px-2"],
});

export const fieldSet = tv({
  base: [
    "flex min-w-0 flex-col gap-6 border-0 p-0",
    "disabled:pointer-events-none disabled:opacity-70 data-disabled:pointer-events-none data-disabled:opacity-70",
  ],
});

export const fieldTitle = tv({
  base: "text-foreground leading-none font-medium",
});

export const fieldValidity = tv({
  base: "text-muted-foreground data-invalid:text-error data-valid:text-success text-sm font-medium",
});
