import { tv } from "tailwind-variants";

export const contextMenu = tv({
  base: "relative",
});

export const contextMenuCheckboxItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/context-menu-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const contextMenuCheckboxItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const contextMenuContent = tv({
  base: [
    "bg-popover text-popover-foreground z-50 min-w-[9rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
    "pointer-events-auto fixed isolate origin-(--transform-origin) will-change-transform",
  ],
});

export const contextMenuItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/context-menu-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const contextMenuLabel = tv({
  base: ["text-muted-foreground px-2 py-1.5 text-sm font-medium"],
  variants: {
    inset: {
      true: "pl-8",
    },
  },
  defaultVariants: {
    inset: false,
  },
});

export const contextMenuRadioGroup = tv({
  base: "",
});

export const contextMenuRadioItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/context-menu-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const contextMenuRadioItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const contextMenuSeparator = tv({
  base: "bg-border -mx-1 my-1 h-px",
});

export const contextMenuShortcut = tv({
  base: [
    "group-data-highlighted/context-menu-item:text-accent-foreground group-focus/context-menu-item:text-accent-foreground group-hover/context-menu-item:text-accent-foreground text-muted-foreground ml-auto text-sm tracking-widest transition-colors",
  ],
});

export const contextMenuTrigger = tv({
  base: [
    "inline-flex items-center justify-center",
    "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "data-disabled:pointer-events-none",
  ],
});
