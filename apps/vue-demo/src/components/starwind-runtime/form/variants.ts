import { tv } from "tailwind-variants";

export const form = tv({
  base: "min-w-0",
});

export const formErrorSummary = tv({
  base: [
    "border-error/40 bg-error/7 text-error rounded-md border p-4 text-sm",
    "[&_[data-sw-form-error-summary-list]]:mt-2 [&_[data-sw-form-error-summary-list]]:grid [&_[data-sw-form-error-summary-list]]:gap-1",
    "[&_[data-sw-form-error-summary-item]]:text-left [&_[data-sw-form-error-summary-item]]:underline [&_[data-sw-form-error-summary-item]]:underline-offset-4",
  ],
});
