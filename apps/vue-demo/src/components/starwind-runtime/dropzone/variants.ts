import { tv } from "tailwind-variants";

export const dropzone = tv({
  base: [
    "relative flex w-full flex-col items-center justify-center gap-1 rounded-lg px-6 py-12 shadow-xs",
    "bg-background dark:bg-input/30 text-muted-foreground border-input cursor-pointer border border-dashed text-center text-sm",
    "data-[is-uploading=false]:hover:bg-muted data-[drag-active=true]:bg-muted transition",
    "focus-visible:border-outline focus-visible:ring-outline/50 outline-none focus-visible:ring-3",
    "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
  ],
});

export const dropzoneFilesList = tv({
  base: [
    "mt-1 -mb-8 min-h-8",
    "bg-muted invisible flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-sm",
    "[&_div]:flex [&_div]:items-center [&_div]:gap-1 [&_svg]:size-3.5",
  ],
});

export const dropzoneLoadingIndicator = tv({
  base: "data-[is-uploading=false]:hidden",
});

export const dropzoneUploadIndicator = tv({
  base: "data-[is-uploading=true]:hidden",
});
