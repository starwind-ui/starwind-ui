import { tv } from "tailwind-variants";
import { button as buttonVariants } from "../button/variants";

export const carouselControl = tv({
  extend: buttonVariants,
  defaultVariants: {
    variant: "outline",
    size: "icon",
  },
});

export const carousel = tv({
  base: "group/carousel relative",
});

export const carouselContent = tv({
  base: "overflow-hidden",
});

export const carouselContainer = tv({
  base: [
    "flex group-data-[axis=y]/carousel:flex-col",
    "group-data-[axis=x]/carousel:-ml-4",
    "group-data-[axis=y]/carousel:-mt-4",
  ],
});

export const carouselItem = tv({
  base: [
    "min-w-0 shrink-0 grow-0 basis-full",
    "group-data-[axis=x]/carousel:pl-4",
    "group-data-[axis=y]/carousel:pt-4",
  ],
});

export const carouselNext = tv({
  base: [
    "absolute size-8 rounded-full",
    "group-data-[axis=x]/carousel:top-1/2 group-data-[axis=x]/carousel:-right-12 group-data-[axis=x]/carousel:-translate-y-1/2",
    "group-data-[axis=y]/carousel:-bottom-12 group-data-[axis=y]/carousel:left-1/2 group-data-[axis=y]/carousel:-translate-x-1/2 group-data-[axis=y]/carousel:rotate-90",
  ],
});

export const carouselPrevious = tv({
  base: [
    "absolute size-8 rounded-full",
    "group-data-[axis=x]/carousel:top-1/2 group-data-[axis=x]/carousel:-left-12 group-data-[axis=x]/carousel:-translate-y-1/2",
    "group-data-[axis=y]/carousel:-top-12 group-data-[axis=y]/carousel:left-1/2 group-data-[axis=y]/carousel:-translate-x-1/2 group-data-[axis=y]/carousel:rotate-90",
  ],
});
