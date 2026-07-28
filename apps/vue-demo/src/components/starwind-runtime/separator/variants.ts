import { tv } from "tailwind-variants";

export const separator = tv({
  base: "bg-border shrink-0",
  variants: {
    orientation: {
      horizontal: "h-[1px] w-full",
      vertical: "h-full w-[1px]",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});
