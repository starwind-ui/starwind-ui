import { tv } from "tailwind-variants";

export const selectContent = tv({
  base: [
    "starwind-select-content",
    "bg-popover text-popover-foreground absolute z-50 min-w-[8rem] rounded-md border shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 overflow-hidden will-change-transform",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
  ],
  variants: {
    side: {
      bottom: "slide-in-from-top-2 slide-out-to-top-2 top-full",
      top: "slide-in-from-bottom-2 slide-out-to-bottom-2 bottom-full",
    },
    align: {
      start: "slide-in-from-left-1 slide-out-to-left-1 left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "slide-in-from-right-1 slide-out-to-right-1 right-0",
    },
    size: {
      sm: "text-sm [&_[data-slot=select-label]]:text-xs",
      md: "text-base [&_[data-slot=select-label]]:text-sm",
      lg: "text-lg [&_[data-slot=select-label]]:text-base",
    },
  },
  defaultVariants: { side: "bottom", align: "start", size: "md" },
});

export const selectContentInner = tv({
  base: "max-h-96 w-full min-w-(--select-trigger-width) overflow-y-auto p-1",
});

export const selectItem = tv({
  base: [
    "relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 outline-none select-none",
    "data-[active]:bg-accent data-[active]:text-accent-foreground",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "not-aria-selected:[&_svg]:hidden aria-selected:[&_svg]:flex",
  ],
});

export const selectItemIcon = tv({
  base: "absolute right-2 flex size-4 items-center justify-center",
});

export const selectLabel = tv({ base: "text-muted-foreground py-1.5 pr-8 pl-2" });

export const selectSearch = tv({
  base: [
    "placeholder:text-muted-foreground flex w-full border-0 bg-transparent px-0 py-2.5",
    "ring-0 outline-none disabled:cursor-not-allowed disabled:opacity-50",
  ],
});

export const selectSeparator = tv({ base: "bg-muted -mx-1 my-1 h-px" });

export const selectTrigger = tv({
  base: [
    "starwind-select-trigger",
    "border-input dark:bg-input/30 text-foreground ring-offset-background flex items-center justify-between gap-2 rounded-md border bg-transparent shadow-xs",
    "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    "aria-invalid:border-error aria-invalid:focus:ring-error/40 aria-invalid:focus:ring-3",
  ],
  variants: {
    size: {
      sm: "h-9 px-2 text-sm",
      md: "h-11 px-3 text-base",
      lg: "h-12 px-4 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const selectValue = tv({ base: "pointer-events-none" });
