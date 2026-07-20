import { tv } from "tailwind-variants";

export const select = tv({
  base: "relative",
});

export const selectContent = tv({
  base: [
    "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
    "data-[align-trigger=true]:!animate-none",
    "pointer-events-auto fixed isolate w-(--anchor-width) origin-(--transform-origin) will-change-transform",
  ],
  variants: {
    size: {
      sm: "text-sm [&_[data-slot=select-label]]:text-xs",
      md: "text-base [&_[data-slot=select-label]]:text-sm",
      lg: "text-lg [&_[data-slot=select-label]]:text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const selectGroup = tv({
  base: "",
});

export const selectItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/select-item [&>svg]:size-4 [&>svg]:shrink-0",
  ],
  variants: {
    inset: {
      true: "pl-8",
    },
    disabled: {
      true: "pointer-events-none opacity-50",
    },
  },
  defaultVariants: {
    inset: false,
    disabled: false,
  },
});

export const selectItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const selectItemText = tv({
  base: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
});

export const selectLabel = tv({
  base: "text-muted-foreground px-2 py-1.5 font-medium",
});

export const selectList = tv({
  base: "max-h-96 overflow-x-hidden overflow-y-auto p-1",
});

export const selectScrollButton = tv({
  base: "bg-popover text-muted-foreground flex w-full cursor-default items-center justify-center py-1 [&>svg]:size-4",
});

export const selectSeparator = tv({
  base: "bg-border -mx-1 my-1 h-px",
});

export const selectTrigger = tv({
  base: [
    "border-input dark:bg-input/30 text-foreground ring-offset-background flex items-center justify-between gap-2 rounded-md border bg-transparent shadow-xs select-none",
    "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3 focus-visible:transition-none",
    "disabled:cursor-not-allowed disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "data-placeholder:text-muted-foreground [&_[data-slot=select-value]]:line-clamp-1 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
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

export const selectValue = tv({
  base: "pointer-events-none flex flex-1 text-left",
});
