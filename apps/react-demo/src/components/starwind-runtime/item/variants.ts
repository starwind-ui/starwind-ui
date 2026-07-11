import { tv } from "tailwind-variants";

export const item = tv({
  base: [
    "group/item flex flex-wrap items-center rounded-md border border-transparent text-sm transition-colors",
    "[a]:hover:bg-accent/50 [a]:transition-colors",
    "focus-visible:border-ring focus-visible:ring-outline/50 outline-none focus-visible:ring-[3px]",
  ],
  variants: {
    variant: {
      default: "bg-transparent",
      outline: "border-border",
      muted: "bg-muted/50",
    },
    size: {
      default: "gap-4 p-4",
      sm: "gap-2.5 px-4 py-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export const itemActions = tv({
  base: "flex items-center gap-2",
});

export const itemContent = tv({
  base: "flex flex-1 flex-col gap-1.5 [&+[data-slot=item-content]]:flex-none",
});

export const itemDescription = tv({
  base: [
    "text-muted-foreground line-clamp-2 leading-snug font-normal text-balance",
    "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
  ],
});

export const itemFooter = tv({
  base: "flex basis-full items-center justify-between gap-2",
});

export const itemGroup = tv({
  base: "group/item-group flex flex-col",
});

export const itemHeader = tv({
  base: "flex basis-full items-center justify-between gap-2",
});

export const itemMedia = tv({
  base: [
    "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none",
    "group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start",
  ],
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "bg-muted size-8 rounded-sm border [&_svg:not([class*='size-'])]:size-4",
      image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const itemSeparator = tv({
  base: "my-0",
});

export const itemTitle = tv({
  base: "flex w-fit items-center gap-2 leading-snug font-medium",
});
