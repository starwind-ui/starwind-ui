import ToastAction from "./ToastAction.vue";
import ToastClose from "./ToastClose.vue";
import ToastContent from "./ToastContent.vue";
import ToastDescription from "./ToastDescription.vue";
import Toaster from "./Toaster.vue";
import ToastItem from "./ToastItem.vue";
import ToastTemplate from "./ToastTemplate.vue";
import ToastTitle from "./ToastTitle.vue";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
  toastViewport,
} from "./variants";

export type { ToastActionProps } from "./ToastAction.vue";
export type { ToastCloseProps } from "./ToastClose.vue";
export type { ToastContentProps } from "./ToastContent.vue";
export type { ToastDescriptionProps } from "./ToastDescription.vue";
export type { ToasterProps } from "./Toaster.vue";
export type { ToastItemProps } from "./ToastItem.vue";
export type { ToastTemplateProps } from "./ToastTemplate.vue";
export type { ToastTitleProps } from "./ToastTitle.vue";

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
