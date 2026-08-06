import { tv } from "tailwind-variants";

export const dropdown = tv({
  base: "relative",
});

export const dropdownCheckboxItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const dropdownCheckboxItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const dropdownContent = tv({
  base: [
    "bg-popover text-popover-foreground z-50 min-w-[9rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
    "pointer-events-auto fixed isolate origin-(--transform-origin) will-change-transform",
  ],
});

export const dropdownItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const dropdownLabel = tv({
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

export const dropdownRadioGroup = tv({
  base: "",
});

export const dropdownRadioItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 transition-colors outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/dropdown-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const dropdownRadioItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const dropdownSeparator = tv({
  base: "bg-border -mx-1 my-1 h-px",
});

export const dropdownShortcut = tv({
  base: [
    "group-data-highlighted/dropdown-item:text-accent-foreground group-focus/dropdown-item:text-accent-foreground group-hover/dropdown-item:text-accent-foreground text-muted-foreground ml-auto text-sm tracking-widest transition-colors",
  ],
});

export const dropdownTrigger = tv({
  base: [
    "inline-flex items-center justify-center",
    "focus-visible:ring-outline/50 transition-[color,box-shadow] outline-none focus-visible:ring-3",
    "disabled:pointer-events-none",
  ],
});
