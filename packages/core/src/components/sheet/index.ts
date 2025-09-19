import Sheet from "./Sheet.astro";
import SheetClose from "./SheetClose.astro";
import SheetContent, { dialogBackdrop, sheetCloseButton, sheetContent } from "./SheetContent.astro";
import SheetDescription, { sheetDescription } from "./SheetDescription.astro";
import SheetFooter, { sheetFooter } from "./SheetFooter.astro";
import SheetHeader, { sheetHeader } from "./SheetHeader.astro";
import SheetTitle, { sheetTitle } from "./SheetTitle.astro";
import SheetTrigger from "./SheetTrigger.astro";

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
