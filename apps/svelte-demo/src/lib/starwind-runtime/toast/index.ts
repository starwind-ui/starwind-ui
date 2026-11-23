import ToastAction from "./ToastAction.svelte";
import ToastClose from "./ToastClose.svelte";
import ToastContent from "./ToastContent.svelte";
import ToastDescription from "./ToastDescription.svelte";
import Toaster from "./Toaster.svelte";
import ToastItem from "./ToastItem.svelte";
import ToastTemplate from "./ToastTemplate.svelte";
import ToastTitle from "./ToastTitle.svelte";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants.js";

export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/svelte/toast";
export { toast } from "@starwind-ui/svelte/toast";
export type { ToastActionProps } from "./ToastAction.svelte";
export type { ToastCloseProps } from "./ToastClose.svelte";
export type { ToastContentProps } from "./ToastContent.svelte";
export type { ToastDescriptionProps } from "./ToastDescription.svelte";
export type { ToasterProps } from "./Toaster.svelte";
export type { ToastItemProps } from "./ToastItem.svelte";
export type { ToastTemplateProps } from "./ToastTemplate.svelte";
export type { ToastTitleProps } from "./ToastTitle.svelte";

const ToastVariants = {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
};
const ToastParts = {
  Viewport: Toaster,
  Template: ToastTemplate,
  Item: ToastItem,
  Content: ToastContent,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
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
export default ToastParts;
