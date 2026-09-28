import Dialog from "./Dialog.svelte";
import DialogTrigger from "./DialogTrigger.svelte";
import DialogContent from "./DialogContent.svelte";
import DialogHeader from "./DialogHeader.svelte";
import DialogFooter from "./DialogFooter.svelte";
import DialogTitle from "./DialogTitle.svelte";
import DialogDescription from "./DialogDescription.svelte";
import DialogClose from "./DialogClose.svelte";
import {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
} from "./variants.js";
export type { DialogProps } from "./Dialog.svelte";
export type { DialogTriggerProps } from "./DialogTrigger.svelte";
export type { DialogContentProps } from "./DialogContent.svelte";
export type { DialogHeaderProps } from "./DialogHeader.svelte";
export type { DialogFooterProps } from "./DialogFooter.svelte";
export type { DialogTitleProps } from "./DialogTitle.svelte";
export type { DialogDescriptionProps } from "./DialogDescription.svelte";
export type { DialogCloseProps } from "./DialogClose.svelte";
const DialogVariants = {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
};
const DialogParts = {
  Root: Dialog,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
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
export default DialogParts;
