import { tv } from "tailwind-variants";

export const buttonGroup = tv({
  base: [
    "flex w-fit items-stretch",
    "[&>*]:focus-visible:relative [&>*]:focus-visible:z-10",
    "has-[>[data-slot=button-group]]:gap-2 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  ],
  variants: {
    orientation: {
      horizontal: [
        "[&>*:not(:first-child)]:rounded-l-none",
        "[&>*:not(:first-child)]:border-l-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))]:rounded-r-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:rounded-l-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:border-l-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-as-child]_>_*]:rounded-r-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:rounded-l-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:border-l-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-slot=select-trigger]]:rounded-r-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-l-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:border-l-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-r-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-l-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:border-l-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-r-none",
      ],
      vertical: [
        "flex-col",
        "[&>*:not(:first-child)]:rounded-t-none",
        "[&>*:not(:first-child)]:border-t-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))]:rounded-b-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:rounded-t-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:border-t-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-as-child]_>_*]:rounded-b-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:rounded-t-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:border-t-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-slot=select-trigger]]:rounded-b-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-t-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:border-t-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-b-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-t-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:border-t-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-b-none",
      ],
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export const buttonGroupSeparator = tv({
  base: ["bg-input relative m-0! self-stretch data-[orientation=vertical]:h-auto"],
});

export const buttonGroupText = tv({
  base: [
    "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  ],
});
