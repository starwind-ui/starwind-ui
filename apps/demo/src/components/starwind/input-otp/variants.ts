import { tv } from "tailwind-variants";

export const inputOtp = tv({
  base: "starwind-input-otp flex items-center gap-2 outline-none has-disabled:opacity-50",
});

export const inputOtpGroup = tv({
  base: "flex items-center",
});

export const inputOtpSeparator = tv({
  base: "text-muted-foreground",
});

export const inputOtpSlot = tv({
  base: [
    "border-input dark:bg-input/30 text-foreground border bg-transparent text-center shadow-xs",
    "relative flex items-center justify-center border-y border-r text-sm transition-all outline-none",
    "first:rounded-l-md first:border-l last:rounded-r-md disabled:cursor-not-allowed disabled:opacity-50",
    "data-[active=true]:border-outline data-[active=true]:ring-outline/50 data-[active=true]:z-10 data-[active=true]:ring-3",
    "data-[active=true]:aria-invalid:ring-error/40",
    "aria-invalid:border-error data-[active=true]:aria-invalid:border-error",
  ],
  variants: {
    size: {
      sm: "size-9 text-sm",
      md: "size-11 text-base",
      lg: "size-12 text-lg",
    },
  },
  defaultVariants: { size: "md" },
});
