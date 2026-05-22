import Dialog from "./Dialog.astro";
import DialogClose from "./DialogClose.astro";
import DialogContent from "./DialogContent.astro";
import DialogDescription from "./DialogDescription.astro";
import DialogFooter from "./DialogFooter.astro";
import DialogHeader from "./DialogHeader.astro";
import DialogTitle from "./DialogTitle.astro";
import DialogTrigger from "./DialogTrigger.astro";
import {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
} from "./variants";

const DialogVariants = {
  dialogBackdrop,
  dialogContent,
  dialogCloseButton,
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
