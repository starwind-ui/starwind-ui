import { tv } from "tailwind-variants";

export const alertDialogBackdrop = tv({
  base: [
    "starwind-alert-dialog-backdrop fixed inset-0 z-50 hidden bg-black/50",
    "data-[state=open]:animate-in fade-in",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out",
  ],
});

export const alertDialogContent = tv({
  base: [
    "bg-background space-y-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
    "fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
    "data-[state=open]:animate-in fade-in zoom-in-95 will-change-transform",
    "data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards fade-out zoom-out-95",
  ],
});

export const alertDialogDescription = tv({ base: "text-muted-foreground" });

export const alertDialogFooter = tv({
  base: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
});

export const alertDialogHeader = tv({ base: "flex flex-col gap-2 text-center sm:text-left" });

export const alertDialogTitle = tv({ base: "font-heading text-xl font-semibold" });
