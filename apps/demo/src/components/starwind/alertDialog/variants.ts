import { tv } from "tailwind-variants";

export const alertDialogBackdropVariant = tv({
  base: [
    "starwind-alert-dialog-backdrop fixed inset-0 top-0 left-0 z-50 hidden h-screen w-screen bg-black/80",
    "data-[state=open]:block data-[state=open]:animate-in fade-in",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
  ],
});

export const alertDialogContentVariant = tv({
  base: [
    "fixed top-16 left-[50%] z-50 translate-x-[-50%] sm:top-[50%] sm:translate-y-[-50%]",
    "bg-background w-full max-w-md border p-8 shadow-lg sm:rounded-lg",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards",
    "fade-in zoom-in-95 slide-in-from-bottom-2",
    "fade-out zoom-out-95 slide-out-to-bottom-2",
  ],
});

export const alertDialogHeaderVariant = tv({
  base: "flex flex-col space-y-2 text-center sm:text-left",
});

export const alertDialogTitleVariant = tv({
  base: "text-2xl leading-none font-semibold tracking-tight",
});

export const alertDialogDescriptionVariant = tv({
  base: "text-muted-foreground",
});

export const alertDialogFooterVariant = tv({
  base: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
});