import AlertDialog from "./AlertDialog.astro";
import AlertDialogAction from "./AlertDialogAction.astro";
import AlertDialogCancel from "./AlertDialogCancel.astro";
import AlertDialogContent from "./AlertDialogContent.astro";
import AlertDialogDescription from "./AlertDialogDescription.astro";
import AlertDialogFooter from "./AlertDialogFooter.astro";
import AlertDialogHeader from "./AlertDialogHeader.astro";
import AlertDialogTitle from "./AlertDialogTitle.astro";
import AlertDialogTrigger from "./AlertDialogTrigger.astro";

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
};

export default {
  Root: AlertDialog,
  Trigger: AlertDialogTrigger,
  Content: AlertDialogContent,
  Header: AlertDialogHeader,
  Footer: AlertDialogFooter,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Cancel: AlertDialogCancel,
  Action: AlertDialogAction,
};