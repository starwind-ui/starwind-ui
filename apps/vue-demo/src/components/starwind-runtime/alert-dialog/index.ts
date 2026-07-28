import AlertDialog from "./AlertDialog.vue";
import AlertDialogAction from "./AlertDialogAction.vue";
import AlertDialogCancel from "./AlertDialogCancel.vue";
import AlertDialogContent from "./AlertDialogContent.vue";
import AlertDialogDescription from "./AlertDialogDescription.vue";
import AlertDialogFooter from "./AlertDialogFooter.vue";
import AlertDialogHeader from "./AlertDialogHeader.vue";
import AlertDialogTitle from "./AlertDialogTitle.vue";
import AlertDialogTrigger from "./AlertDialogTrigger.vue";
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
} from "./variants";

export type { AlertDialogProps } from "./AlertDialog.vue";
export type { AlertDialogActionProps } from "./AlertDialogAction.vue";
export type { AlertDialogCancelProps } from "./AlertDialogCancel.vue";
export type { AlertDialogContentProps } from "./AlertDialogContent.vue";
export type { AlertDialogDescriptionProps } from "./AlertDialogDescription.vue";
export type { AlertDialogFooterProps } from "./AlertDialogFooter.vue";
export type { AlertDialogHeaderProps } from "./AlertDialogHeader.vue";
export type { AlertDialogTitleProps } from "./AlertDialogTitle.vue";
export type { AlertDialogTriggerProps } from "./AlertDialogTrigger.vue";

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

export default {
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
