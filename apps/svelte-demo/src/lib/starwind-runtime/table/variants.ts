import { tv } from "tailwind-variants";

export const table = tv({
  base: "w-full caption-bottom text-sm",
});

export const tableBody = tv({
  base: "[&_tr:last-child]:border-0",
});

export const tableCaption = tv({
  base: "text-muted-foreground mt-4 text-sm",
});

export const tableCell = tv({
  base: "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
});

export const tableFoot = tv({
  base: "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
});

export const tableHead = tv({
  base: "text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
});

export const tableHeader = tv({
  base: "[&_tr]:border-b",
});

export const tableRow = tv({
  base: "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
});
