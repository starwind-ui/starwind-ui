import { tv } from "tailwind-variants";

export const tabs = tv({ base: "starwind-tabs" });

export const tabsContent = tv({
  base: "mt-2 focus-visible:outline-2 focus-visible:outline-offset-2",
});

export const tabsList = tv({
  base: "bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-md p-1",
});

export const tabsTrigger = tv({
  base: [
    "inline-flex grow items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-1.5 font-medium whitespace-nowrap transition-[color,box-shadow]",
    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
    "dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "focus-visible:border-outline focus-visible:ring-outline/50 focus-visible:outline-outline focus-visible:ring-3 focus-visible:outline-1",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
});
