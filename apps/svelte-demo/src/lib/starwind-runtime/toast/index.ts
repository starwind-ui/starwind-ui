import Toaster from "./Toaster.svelte";
import ToastTemplate from "./ToastTemplate.svelte";
import ToastItem from "./ToastItem.svelte";
import ToastContent from "./ToastContent.svelte";
import ToastTitle from "./ToastTitle.svelte";
import ToastDescription from "./ToastDescription.svelte";
import ToastAction from "./ToastAction.svelte";
import ToastClose from "./ToastClose.svelte";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants.js";
export type { ToasterProps } from "./Toaster.svelte";
export type { ToastTemplateProps } from "./ToastTemplate.svelte";
export type { ToastItemProps } from "./ToastItem.svelte";
export type { ToastContentProps } from "./ToastContent.svelte";
export type { ToastTitleProps } from "./ToastTitle.svelte";
export type { ToastDescriptionProps } from "./ToastDescription.svelte";
export type { ToastActionProps } from "./ToastAction.svelte";
export type { ToastCloseProps } from "./ToastClose.svelte";
export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/svelte/toast";
export { toast } from "@starwind-ui/svelte/toast";
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
  ToastItem,
  ToastTemplate,
  ToastTitle,
  ToastVariants,
  Toaster,
};
export default ToastParts;
