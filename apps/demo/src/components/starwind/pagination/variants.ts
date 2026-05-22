import { tv } from "tailwind-variants";

export const pagination = tv({ base: "mx-auto flex w-full justify-center" });

export const paginationContent = tv({ base: "flex flex-row items-center gap-1" });

export const paginationEllipsis = tv({
  base: "flex items-center justify-center",
  variants: {
    size: {
      "icon-sm": "size-9",
      icon: "size-11",
      "icon-lg": "size-12",
    },
  },
  defaultVariants: { size: "icon" },
});

export const paginationNext = tv({ base: "group gap-1" });

export const paginationPrevious = tv({ base: "group gap-1" });
