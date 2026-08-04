import { tv } from "tailwind-variants";

export const inputOtp = tv({
  base: "group/input-otp flex items-center gap-2 outline-none data-disabled:opacity-50",
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
    "data-[active=true]:data-error-visible:ring-error/40",
    "data-error-visible:border-error data-[active=true]:data-error-visible:border-error",
    "group-data-[size=sm]/input-otp:size-9 group-data-[size=sm]/input-otp:text-sm",
    "group-data-[size=md]/input-otp:size-11 group-data-[size=md]/input-otp:text-base",
    "group-data-[size=lg]/input-otp:size-12 group-data-[size=lg]/input-otp:text-lg",
  ],
});
