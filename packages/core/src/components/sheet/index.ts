import Sheet from "./Sheet.astro";
import SheetClose from "./SheetClose.astro";
import SheetContent from "./SheetContent.astro";
import SheetDescription from "./SheetDescription.astro";
import SheetFooter from "./SheetFooter.astro";
import SheetHeader from "./SheetHeader.astro";
import SheetTitle from "./SheetTitle.astro";
import SheetTrigger from "./SheetTrigger.astro";
import {
  dialogBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
} from "./variants";

const SheetVariants = {
  sheetCloseButton,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
  dialogBackdrop,
  sheetContent,
};

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetVariants,
};

export default {
  Root: Sheet,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header: SheetHeader,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
};
