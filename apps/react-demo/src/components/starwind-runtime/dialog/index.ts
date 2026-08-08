"use client";

import Dialog from "./Dialog";
import DialogClose from "./DialogClose";
import DialogContent from "./DialogContent";
import DialogDescription from "./DialogDescription";
import DialogFooter from "./DialogFooter";
import DialogHeader from "./DialogHeader";
import DialogTitle from "./DialogTitle";
import DialogTrigger from "./DialogTrigger";
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
