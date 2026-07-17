import { tv } from "tailwind-variants";

export const popover = tv({
  base: "",
});

export const popoverContent = tv({
  base: [
    "bg-popover text-popover-foreground z-50 flex w-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-lg border p-2.5 shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2",
    "pointer-events-auto fixed isolate origin-(--transform-origin) will-change-transform",
  ],
  variants: {
    exitMotion: {
      popover: [
        "zoom-out-95",
        "data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-out-to-bottom-2",
        "data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-out-to-right-2",
      ],
      fade: "",
    },
  },
  defaultVariants: {
    exitMotion: "popover",
  },
});

export const popoverDescription = tv({
  base: "text-muted-foreground",
});

export const popoverHeader = tv({
  base: "flex flex-col gap-1",
});

export const popoverTitle = tv({
  base: "font-medium",
});

export const popoverTrigger = tv({
  base: [
    "inline-flex items-center justify-center",
    "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "disabled:pointer-events-none",
  ],
});
