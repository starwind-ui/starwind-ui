import type { PromiseOptions, PromiseStateOption, ToastOptions, Variant } from "./toast-manager";
import { toast } from "./toast-manager";
import ToastDescription from "./ToastDescription.astro";
import Toaster from "./Toaster.astro";
import ToastItem from "./ToastItem.astro";
import ToastTemplate from "./ToastTemplate.astro";
import ToastTitle from "./ToastTitle.astro";
import { toastDescription, toastItem, toastTitle, toastViewport } from "./variants";
const ToastVariants = {
  toastViewport,
  toastDescription,
  toastItem,
  toastTitle,
};

export {
  type PromiseOptions,
  type PromiseStateOption,
  toast,
  ToastDescription,
  Toaster,
  ToastItem,
  type ToastOptions,
  ToastTemplate,
  ToastTitle,
  ToastVariants,
  type Variant,
};

export default {
  Manager: toast,
  Viewport: Toaster,
  Item: ToastItem,
  Title: ToastTitle,
  Description: ToastDescription,
  Template: ToastTemplate,
};
