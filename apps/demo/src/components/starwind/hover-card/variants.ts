import { tv } from "tailwind-variants";

export const hoverCard = tv({ base: "starwind-hover-card inline-block" });

export const hoverCardContent = tv({
  base: [
    "starwind-hover-card-content",
    "bg-popover text-popover-foreground fixed z-50 hidden w-64 rounded-lg border p-3 shadow-md outline-hidden duration-100",
    "animate-in fade-in-0 zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
    "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
  ],
});

export const hoverCardTrigger = tv({
  base: [
    "starwind-hover-card-trigger",
    "inline-flex items-center justify-center",
    "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "disabled:pointer-events-none",
  ],
});
