import { tv } from "tailwind-variants";

export const inputGroup = tv({
  base: [
    "border-input dark:bg-input/30 group/input-group relative flex h-11 w-full min-w-0 items-center rounded-lg border transition-colors outline-none",
    "has-[[data-slot=input-group-control]:focus-visible]:border-outline has-[[data-slot=input-group-control]:focus-visible]:ring-outline/50 has-[[data-slot=input-group-control]:focus-visible]:ring-3",
    "has-[[data-slot][aria-invalid=true]]:border-error has-[[data-slot][aria-invalid=true]]:ring-error/40 has-[[data-slot][aria-invalid=true]]:ring-3",
    "has-disabled:bg-input/50 has-disabled:opacity-50",
    "has-[>textarea]:h-auto",
    "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
    "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col",
    "has-[>[data-align=block-end]]:[&>[data-slot=input-group-control]]:pt-3",
    "has-[>[data-align=block-start]]:[&>[data-slot=input-group-control]]:pb-3",
    "has-[>[data-align=inline-end]]:[&>[data-slot=input-group-control]]:pr-1.5",
    "has-[>[data-align=inline-start]]:[&>[data-slot=input-group-control]]:pl-1.5",
  ],
});

export const inputGroupAddon = tv({
  base: [
    "text-muted-foreground flex cursor-text items-center justify-center gap-2 text-sm font-medium select-none",
    "group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-xs [&>svg:not([class*='size-'])]:size-4",
  ],
  variants: {
    align: {
      "inline-start": "order-first pl-2.5 has-[>button]:ml-[-0.3rem]",
      "inline-end": "order-last pr-2.5 has-[>button]:mr-[-0.3rem]",
      "block-start":
        "order-first w-full justify-start px-3 pt-2 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-2.5",
      "block-end":
        "order-last w-full justify-start px-3 pb-2 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-2.5",
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
});

export const inputGroupButton = tv({
  base: "gap-2 rounded-sm shadow-none",
  variants: {
    size: {
      sm: "h-8 px-2",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

export const inputGroupInput = tv({
  base: "h-full flex-1 rounded-none border-0 shadow-none ring-0 outline-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
});

export const inputGroupText = tv({
  base: [
    "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4.5",
  ],
});

export const inputGroupTextarea = tv({
  base: "h-full flex-1 resize-none rounded-none border-0 shadow-none ring-0 outline-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
});
