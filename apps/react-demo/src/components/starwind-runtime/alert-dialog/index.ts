import AlertDialog from "./AlertDialog";
import AlertDialogAction from "./AlertDialogAction";
import AlertDialogCancel from "./AlertDialogCancel";
import AlertDialogContent from "./AlertDialogContent";
import AlertDialogDescription from "./AlertDialogDescription";
import AlertDialogFooter from "./AlertDialogFooter";
import AlertDialogHeader from "./AlertDialogHeader";
import AlertDialogTitle from "./AlertDialogTitle";
import AlertDialogTrigger from "./AlertDialogTrigger";
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
