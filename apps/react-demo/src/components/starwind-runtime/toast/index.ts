"use client";

import ToastAction from "./ToastAction";
import ToastClose from "./ToastClose";
import ToastContent from "./ToastContent";
import ToastDescription from "./ToastDescription";
import Toaster from "./Toaster";
import ToastItem from "./ToastItem";
import ToastTemplate from "./ToastTemplate";
import ToastTitle from "./ToastTitle";
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

export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/react/toast";
export { toast } from "@starwind-ui/react/toast";

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
