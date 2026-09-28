import { tv } from "tailwind-variants";

export const kbd = tv({
  base: [
    "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none",
    "bg-muted text-muted-foreground",
    "[&_svg:not([class*='size-'])]:size-3",
    "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
  ],
});

export const kbdGroup = tv({
  base: "inline-flex items-center gap-1",
});
