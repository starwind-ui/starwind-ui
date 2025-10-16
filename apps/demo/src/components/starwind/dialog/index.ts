import Dialog from "./Dialog.astro";
import DialogClose from "./DialogClose.astro";
import DialogContent, {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
} from "./DialogContent.astro";
import DialogDescription, { dialogDescription } from "./DialogDescription.astro";
import DialogFooter, { dialogFooter } from "./DialogFooter.astro";
import DialogHeader, { dialogHeader } from "./DialogHeader.astro";
import DialogTitle, { dialogTitle } from "./DialogTitle.astro";
import DialogTrigger from "./DialogTrigger.astro";

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
