import ToastAction from "./ToastAction.astro";
import ToastClose from "./ToastClose.astro";
import ToastContent from "./ToastContent.astro";
import ToastDescription from "./ToastDescription.astro";
import Toaster from "./Toaster.astro";
import ToastItem from "./ToastItem.astro";
import ToastTemplate from "./ToastTemplate.astro";
import ToastTitle from "./ToastTitle.astro";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants";

const ToastVariants = {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
};

export {
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastItem,
  ToastTemplate,
  ToastTitle,
  ToastVariants,
};

export default {
  Viewport: Toaster,
  Template: ToastTemplate,
  Item: ToastItem,
  Content: ToastContent,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
};
