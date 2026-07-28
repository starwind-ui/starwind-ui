import Dialog from "./Dialog.vue";
import DialogClose from "./DialogClose.vue";
import DialogContent from "./DialogContent.vue";
import DialogDescription from "./DialogDescription.vue";
import DialogFooter from "./DialogFooter.vue";
import DialogHeader from "./DialogHeader.vue";
import DialogTitle from "./DialogTitle.vue";
import DialogTrigger from "./DialogTrigger.vue";
import {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
} from "./variants";

export type { DialogProps } from "./Dialog.vue";
export type { DialogCloseProps } from "./DialogClose.vue";
export type { DialogContentProps } from "./DialogContent.vue";
export type { DialogDescriptionProps } from "./DialogDescription.vue";
export type { DialogFooterProps } from "./DialogFooter.vue";
export type { DialogHeaderProps } from "./DialogHeader.vue";
export type { DialogTitleProps } from "./DialogTitle.vue";
export type { DialogTriggerProps } from "./DialogTrigger.vue";

const DialogVariants = {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
};

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogVariants,
};

export default {
  Root: Dialog,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};
