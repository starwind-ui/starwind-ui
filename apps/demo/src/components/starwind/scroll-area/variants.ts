import { tv } from "tailwind-variants";

export const scrollArea = tv({
  slots: {
    root: "starwind-scroll-area relative overflow-hidden",
    viewport:
      "starwind-scroll-area-viewport focus-visible:ring-outline/50 size-full overflow-auto rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
    content: "starwind-scroll-area-content min-w-fit",
    corner:
      "starwind-scroll-area-corner bg-background absolute end-0 bottom-0 z-10 hidden size-2.5",
  },
});

export const scrollBar = tv({
  base: [
    "starwind-scroll-area-scrollbar absolute z-10 flex touch-none p-px transition-colors select-none",
    "data-[orientation=horizontal]:inset-x-0 data-[orientation=horizontal]:bottom-0 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent",
    "data-[orientation=vertical]:inset-y-0 data-[orientation=vertical]:end-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent",
  ],
});

export const scrollBarThumb = tv({
  base: "starwind-scroll-area-thumb bg-border relative flex-1 rounded-full",
});
