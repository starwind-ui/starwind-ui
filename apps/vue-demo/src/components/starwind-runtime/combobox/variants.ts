import { tv } from "tailwind-variants";

export const combobox = tv({
  base: "relative",
});

export const comboboxClear = tv({
  base: [
    "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center justify-center rounded-sm transition-colors outline-none",
    "focus-visible:ring-outline/50 focus-visible:ring-2",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const comboboxContent = tv({
  base: [
    "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
    "data-[state=open]:animate-in fade-in zoom-in-95 outline-none",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
    "pointer-events-auto fixed isolate w-(--anchor-width) origin-(--transform-origin) will-change-transform",
  ],
  variants: {
    size: {
      sm: "text-sm [&_[data-slot=combobox-group-label]]:text-xs",
      md: "text-base [&_[data-slot=combobox-group-label]]:text-sm",
      lg: "text-lg [&_[data-slot=combobox-group-label]]:text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const comboboxEmpty = tv({
  base: "text-muted-foreground px-3 py-6 text-center text-sm",
});

export const comboboxGroup = tv({
  base: "",
});

export const comboboxGroupLabel = tv({
  base: "text-muted-foreground px-2 py-1.5 font-medium",
});

export const comboboxInput = tv({
  base: [
    "placeholder:text-muted-foreground text-foreground flex h-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent py-1 pr-1 pl-3 shadow-none ring-0 outline-none",
    "focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "data-error-visible:text-error data-error-visible:ring-0",
  ],
});

export const comboboxInputGroup = tv({
  base: [
    "focus-within:border-outline focus-within:ring-outline/50 w-auto transition-[color,box-shadow] focus-within:ring-3 focus-within:transition-none",
    "has-[[data-slot=combobox-input][data-error-visible]]:border-error has-[[data-slot=combobox-input][data-error-visible]]:ring-error/40",
    "[&>[data-align=inline-end]:has(>div>button)]:mr-[-0.3rem]",
  ],
  variants: {
    size: {
      sm: "h-9 text-sm [&_[data-slot=combobox-input]]:text-sm",
      md: "h-11 text-base [&_[data-slot=combobox-input]]:text-base",
      lg: "h-12 text-lg [&_[data-slot=combobox-input]]:text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const comboboxItem = tv({
  base: [
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-none select-none",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "group/combobox-item [&>svg]:size-4 [&>svg]:shrink-0",
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

export const comboboxItemIndicator = tv({
  base: [
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0 transition-opacity",
    "data-hidden:opacity-0 data-visible:opacity-100 data-[state=checked]:opacity-100",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
});

export const comboboxItemText = tv({
  base: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
});

export const comboboxLabel = tv({
  base: "text-foreground text-sm font-medium",
});

export const comboboxList = tv({
  base: "max-h-96 overflow-x-hidden overflow-y-auto p-1",
});

export const comboboxSeparator = tv({
  base: "bg-border -mx-1 my-1 h-px",
});

export const comboboxTrigger = tv({
  base: [
    "text-muted-foreground transition-[color,box-shadow] outline-none",
    "focus-visible:ring-outline/50 focus-visible:ring-2 focus-visible:transition-none",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
});

export const comboboxValue = tv({
  base: "text-muted-foreground text-sm",
});
