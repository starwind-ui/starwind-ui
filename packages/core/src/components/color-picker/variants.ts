import { tv } from "tailwind-variants";

export const colorInput = tv({
  base: [
    "border-input dark:bg-input/30 text-foreground pointer-events-none absolute h-full w-full cursor-pointer appearance-none rounded-md border border-none bg-transparent bg-none p-0 shadow-xs",
    "[&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0",
    "focus-visible:border-outline focus-visible:ring-outline/50 transition-[color,box-shadow] focus-visible:ring-3",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=disabled]:pointer-events-none data-[state=enabled]:pointer-events-auto",
    "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
    "peer placeholder:text-muted-foreground",
  ],
  variants: {
    size: { sm: "rounded-[5px]", md: "rounded-sm", lg: "rounded-md" },
  },
  defaultVariants: { size: "md" },
});

export const colorPicker = tv({
  base: [
    "bg-card absolute w-100 rounded-md border",
    "data-[state=hidden]:z-0 data-[state=hidden]:hidden data-[state=visible]:z-20 data-[state=visible]:block",
    "data-[position-x=left]:left-0 data-[position-x=right]:right-0",
    "data-[position-y=bottom]:bottom-full data-[position-y=top]:top-full",
    "data-[position-y=bottom]:mb-2 data-[position-y=top]:mt-2",
  ],
  variants: {
    size: { sm: "w-60 p-3", md: "w-80 p-4", lg: "w-100 p-5" },
  },
  defaultVariants: { size: "md" },
});

export const pickerContainer = tv({
  base: ["starwind-color-picker", "border-input relative rounded-[9.5px]"],
  variants: {
    size: {
      sm: "h-5 w-5 rounded-[5.5px] border",
      md: "h-7 w-7 rounded-[7.5px] border-2",
      lg: "h-9 w-9 rounded-[10.5px] border-3",
    },
  },
  defaultVariants: { size: "md" },
});

export const colorFormatSelect = tv({
  base: ["flex min-w-22 overflow-y-visible"],
  variants: {
    size: { sm: "min-w-18", md: "min-w-20", lg: "min-w-22" },
  },
  defaultVariants: { size: "md" },
});
