import { tv } from "tailwind-variants";

export const pagination = tv({
  base: "mx-auto flex w-full justify-center",
});

export const paginationContent = tv({
  base: "flex flex-row items-center gap-1",
});

export const paginationEllipsis = tv({
  base: "flex items-center justify-center",
  variants: {
    size: {
      "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
      icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5",
      "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    size: "icon",
  },
});
