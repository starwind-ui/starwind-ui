import { tv } from "tailwind-variants";

const accordionVariants = tv({ base: "starwind-accordion" });
const accordionContentVariants = tv({
  base: [
    "starwind-accordion-content",
    "transform-gpu overflow-hidden",
    "data-[state=closed]:animate-accordion-up data-[state=closed]:h-0",
    "data-[state=open]:animate-accordion-down",
  ],
});
const accordionItemVariants = tv({
  base: "starwind-accordion-item border-x border-b first:rounded-t-lg first:border-t last:rounded-b-lg",
});
const accordionTriggerVariants = tv({
  base: [
    "starwind-accordion-trigger",
    "flex w-full items-center justify-between gap-4 rounded-md px-5 py-4",
    "starwind-transition-colors hover:text-muted-foreground text-left font-medium",
    "[&[data-state=open]>svg]:rotate-180",
    "focus-visible:outline-outline focus-visible:outline-2 focus-visible:outline-offset-0",
  ],
});

export {
  accordionVariants,
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerVariants,
};
