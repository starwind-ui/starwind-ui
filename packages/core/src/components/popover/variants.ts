import { tv } from "tailwind-variants";

export const popover = tv({ base: "starwind-popover" });

export const popoverContent = tv({
  base: [
    "starwind-popover-content",
    "bg-popover text-popover-foreground z-50 flex w-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-lg border p-2.5 shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
    "pointer-events-auto fixed isolate will-change-transform",
  ],
  variants: {
    side: {
      bottom: "slide-in-from-top-2 slide-out-to-top-2",
      top: "slide-in-from-bottom-2 slide-out-to-bottom-2",
      right: "slide-in-from-left-2 slide-out-to-left-2",
      left: "slide-in-from-right-2 slide-out-to-right-2",
    },
    align: {
      start: "",
      center: "",
      end: "",
    },
  },
  compoundVariants: [
    {
      side: ["top", "bottom"],
      align: "start",
      class: "slide-in-from-left-1 slide-out-to-left-1",
    },
    {
      side: ["top", "bottom"],
      align: "end",
      class: "slide-in-from-right-1 slide-out-to-right-1",
    },
  ],
  defaultVariants: {
    side: "bottom",
    align: "center",
  },
});

export const popoverDescription = tv({ base: "text-muted-foreground" });

export const popoverHeader = tv({ base: "flex flex-col gap-1" });

export const popoverTitle = tv({ base: "font-medium" });

export const popoverTrigger = tv({
  base: [
    "starwind-popover-trigger",
    "inline-flex items-center justify-center",
    "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "disabled:pointer-events-none",
  ],
});
