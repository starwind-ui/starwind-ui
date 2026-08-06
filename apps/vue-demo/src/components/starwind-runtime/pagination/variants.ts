import { tv } from "tailwind-variants";

export const pagination = tv({
  base: "group/pagination mx-auto flex w-full justify-center",
});

export const paginationContent = tv({
  base: "flex flex-row items-center gap-1",
});

export const paginationLink = tv({
  base: [
    "group-data-[size=sm]/pagination:size-9 group-data-[size=sm]/pagination:p-0 group-data-[size=sm]/pagination:text-sm",
    "group-data-[size=md]/pagination:size-11 group-data-[size=md]/pagination:p-0 group-data-[size=md]/pagination:text-base",
    "group-data-[size=lg]/pagination:size-12 group-data-[size=lg]/pagination:p-0 group-data-[size=lg]/pagination:text-lg",
  ],
});

export const paginationEllipsis = tv({
  base: [
    "flex items-center justify-center",
    "group-data-[size=lg]/pagination:size-12 group-data-[size=md]/pagination:size-11 group-data-[size=sm]/pagination:size-9",
  ],
});

export const paginationNext = tv({
  base: [
    "group w-auto gap-1",
    "group-data-[size=sm]/pagination:h-9 group-data-[size=sm]/pagination:px-4 group-data-[size=sm]/pagination:text-sm",
    "group-data-[size=md]/pagination:h-11 group-data-[size=md]/pagination:px-5 group-data-[size=md]/pagination:text-base",
    "group-data-[size=lg]/pagination:h-12 group-data-[size=lg]/pagination:px-8 group-data-[size=lg]/pagination:text-lg",
  ],
});

export const paginationPrevious = tv({
  base: [
    "group w-auto gap-1",
    "group-data-[size=sm]/pagination:h-9 group-data-[size=sm]/pagination:px-4 group-data-[size=sm]/pagination:text-sm",
    "group-data-[size=md]/pagination:h-11 group-data-[size=md]/pagination:px-5 group-data-[size=md]/pagination:text-base",
    "group-data-[size=lg]/pagination:h-12 group-data-[size=lg]/pagination:px-8 group-data-[size=lg]/pagination:text-lg",
  ],
});
