import AlertDialog from "./AlertDialog.svelte";
import AlertDialogAction from "./AlertDialogAction.svelte";
import AlertDialogCancel from "./AlertDialogCancel.svelte";
import AlertDialogContent from "./AlertDialogContent.svelte";
import AlertDialogDescription from "./AlertDialogDescription.svelte";
import AlertDialogFooter from "./AlertDialogFooter.svelte";
import AlertDialogHeader from "./AlertDialogHeader.svelte";
import AlertDialogTitle from "./AlertDialogTitle.svelte";
import AlertDialogTrigger from "./AlertDialogTrigger.svelte";
import {
  alertDialogAction,
  alertDialogActionAsChild,
  alertDialogBackdrop,
  alertDialogCancel,
  alertDialogCancelAsChild,
  alertDialogContent,
  alertDialogDescription,
  alertDialogFooter,
  alertDialogHeader,
  alertDialogTitle,
} from "./variants.js";

export type { AlertDialogProps } from "./AlertDialog.svelte";
export type { AlertDialogActionProps } from "./AlertDialogAction.svelte";
export type { AlertDialogCancelProps } from "./AlertDialogCancel.svelte";
export type { AlertDialogContentProps } from "./AlertDialogContent.svelte";
export type { AlertDialogDescriptionProps } from "./AlertDialogDescription.svelte";
export type { AlertDialogFooterProps } from "./AlertDialogFooter.svelte";
export type { AlertDialogHeaderProps } from "./AlertDialogHeader.svelte";
export type { AlertDialogTitleProps } from "./AlertDialogTitle.svelte";
export type { AlertDialogTriggerProps } from "./AlertDialogTrigger.svelte";

const AlertDialogVariants = {
  alertDialogAction,
  alertDialogActionAsChild,
  alertDialogBackdrop,
  alertDialogCancel,
  alertDialogCancelAsChild,
  alertDialogContent,
  alertDialogDescription,
  alertDialogFooter,
  alertDialogHeader,
  alertDialogTitle,
};
const AlertDialogParts = {
  Root: AlertDialog,
  Trigger: AlertDialogTrigger,
  Content: AlertDialogContent,
  Header: AlertDialogHeader,
  Footer: AlertDialogFooter,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
};

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogVariants,
};
export default AlertDialogParts;
