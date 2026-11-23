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
        "[&>.transition-all]:transition",
        "[&>*>[data-as-child]>.transition-all]:transition",
        "[&>*>[data-slot=select-trigger].transition-all]:transition",
        "[&>[data-slot=dropdown]>[data-sw-menu-trigger].transition-all]:transition",
        "[&>[data-slot=dropdown]>*>[data-sw-menu-trigger].transition-all]:transition",
        "[&>*:not(:first-child)]:rounded-s-none",
        "[&>*:not(:first-child)]:border-s-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))]:rounded-e-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:rounded-s-none",
        "[&>*:not(:first-child)_>_[data-as-child]_>_*]:border-s-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-as-child]_>_*]:rounded-e-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:rounded-s-none",
        "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:border-s-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-slot=select-trigger]]:rounded-e-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-s-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:border-s-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-e-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-s-none",
        "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:border-s-0",
        "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-e-none",
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
