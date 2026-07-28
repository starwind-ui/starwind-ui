import { tv } from "tailwind-variants";

export const toggleGroup = tv({
  base: [
    "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg",
    "data-[size=sm]:rounded-[min(var(--radius-md),10px)]",
    "data-vertical:flex-col data-vertical:items-stretch",
  ],
});

export const toggleGroupItem = tv({
  base: [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[state=on]:bg-muted data-[state=on]:text-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "focus-visible:border-outline focus-visible:ring-outline/50 focus:z-10 focus-visible:z-10 focus-visible:ring-3",
    "transition-colors outline-none",
    "aria-invalid:ring-error/40 aria-invalid:border-error",
    "group-data-[variant=default]/toggle-group:hover:bg-muted group-data-[variant=default]/toggle-group:hover:text-foreground group-data-[variant=default]/toggle-group:bg-transparent",
    "group-data-[variant=outline]/toggle-group:border-input group-data-[variant=outline]/toggle-group:hover:bg-muted group-data-[variant=outline]/toggle-group:hover:text-foreground group-data-[variant=outline]/toggle-group:border group-data-[variant=outline]/toggle-group:bg-transparent group-data-[variant=outline]/toggle-group:shadow-xs",
    "group-data-[size=sm]/toggle-group:h-9 group-data-[size=sm]/toggle-group:min-w-9 group-data-[size=sm]/toggle-group:px-2 group-data-[size=sm]/toggle-group:text-sm",
    "group-data-[size=md]/toggle-group:h-11 group-data-[size=md]/toggle-group:min-w-11 group-data-[size=md]/toggle-group:px-2.5 group-data-[size=md]/toggle-group:text-base",
    "group-data-[size=lg]/toggle-group:h-12 group-data-[size=lg]/toggle-group:min-w-12 group-data-[size=lg]/toggle-group:px-3 group-data-[size=lg]/toggle-group:text-lg",
    "group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2",
    "group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5",
    "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-l-lg group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-t-lg",
    "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-r-lg group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-b-lg",
    "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:border-l-0 group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:border-t-0",
    "group-data-horizontal/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:first:border-l group-data-vertical/toggle-group:group-data-[spacing=0]/toggle-group:group-data-[variant=outline]/toggle-group:first:border-t",
  ],
  variants: {
    variant: {
      default: "hover:bg-muted hover:text-foreground bg-transparent",
      outline: "border-input hover:bg-muted hover:text-foreground border bg-transparent shadow-xs",
    },
    size: {
      sm: "h-9 min-w-9 px-2 text-sm",
      md: "h-11 min-w-11 px-2.5 text-base",
      lg: "h-12 min-w-12 px-3 text-lg",
    },
  },
});
