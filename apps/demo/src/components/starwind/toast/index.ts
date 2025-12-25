import Toaster, { toastViewport } from "./Toaster.astro";
import ToastItem, { toastItem } from "./ToastItem.astro";
import ToastTitle, { toastTitle } from "./ToastTitle.astro";
import ToastDescription, { toastDescription } from "./ToastDescription.astro";
import ToastTrigger from "./ToastTrigger.astro";

const ToastVariants = {
  viewport: toastViewport,
  item: toastItem,
  title: toastTitle,
  description: toastDescription,
};

export { Toaster, ToastItem, ToastTitle, ToastDescription, ToastTrigger, ToastVariants };

export default {
  Viewport: Toaster,
  Trigger: ToastTrigger,
  Item: ToastItem,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastTrigger,
};
