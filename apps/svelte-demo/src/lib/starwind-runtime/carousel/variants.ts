import { tv } from "tailwind-variants";
import { button as buttonVariants } from "../button/variants.js";

export const carouselControl = tv({
  extend: buttonVariants,
  defaultVariants: {
    variant: "outline",
    size: "icon",
  },
});

export const carousel = tv({
  base: [
    "group/carousel relative [--sw-carousel-outside:calc(var(--spacing)*-12)]",
    "[--sw-carousel-block-gap:0px] [--sw-carousel-flow:row] [--sw-carousel-inline-gap:calc(var(--spacing)*4)]",
    "[--sw-carousel-next:50%_var(--sw-carousel-outside)_auto_auto] [--sw-carousel-previous:50%_auto_auto_var(--sw-carousel-outside)]",
    "[--sw-carousel-icon-turn:none] [--sw-carousel-shift:0_-50%] [--sw-carousel-turn:none]",
    "rtl:data-[axis=x]:[--sw-carousel-icon-turn:180deg] rtl:data-[axis=x]:[--sw-carousel-next:50%_auto_auto_var(--sw-carousel-outside)] rtl:data-[axis=x]:[--sw-carousel-previous:50%_var(--sw-carousel-outside)_auto_auto]",
    "data-[axis=y]:[--sw-carousel-block-gap:calc(var(--spacing)*4)] data-[axis=y]:[--sw-carousel-flow:column] data-[axis=y]:[--sw-carousel-inline-gap:0px]",
    "data-[axis=y]:[--sw-carousel-next:auto_auto_var(--sw-carousel-outside)_50%] data-[axis=y]:[--sw-carousel-previous:var(--sw-carousel-outside)_auto_auto_50%]",
    "data-[axis=y]:[--sw-carousel-shift:-50%_0] data-[axis=y]:[--sw-carousel-turn:90deg]",
  ],
});

export const carouselContent = tv({
  base: "overflow-hidden",
});

export const carouselContainer = tv({
  base: "-ms-(--sw-carousel-inline-gap) -mt-(--sw-carousel-block-gap) flex [flex-direction:var(--sw-carousel-flow)]",
});

export const carouselItem = tv({
  base: "min-w-0 shrink-0 grow-0 basis-full ps-(--sw-carousel-inline-gap) pt-(--sw-carousel-block-gap)",
});

export const carouselNext = tv({
  base: "absolute inset-(--sw-carousel-next) size-8 [translate:var(--sw-carousel-shift)] rotate-(--sw-carousel-turn) rounded-full",
});

export const carouselPrevious = tv({
  base: "absolute inset-(--sw-carousel-previous) size-8 [translate:var(--sw-carousel-shift)] rotate-(--sw-carousel-turn) rounded-full",
});
