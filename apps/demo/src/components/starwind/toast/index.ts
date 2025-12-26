// Re-export types only (not the toast function itself to avoid client bundle issues)
import type { PromiseOptions, PromiseStateOption, ToastOptions, Variant } from "./toast-manager";
import ToastDescription, { toastDescription } from "./ToastDescription.astro";
import Toaster, { toastViewport } from "./Toaster.astro";
import ToastItem, { toastItem } from "./ToastItem.astro";
import ToastTitle, { toastTitle } from "./ToastTitle.astro";

const ToastVariants = {
  viewport: toastViewport,
  item: toastItem,
  title: toastTitle,
  description: toastDescription,
};

export {
  type PromiseOptions,
  type PromiseStateOption,
  ToastDescription,
  Toaster,
  ToastItem,
  type ToastOptions,
  ToastTitle,
  ToastVariants,
  type Variant,
};

export default {
  Viewport: Toaster,
  Item: ToastItem,
  Title: ToastTitle,
  Description: ToastDescription,
};
