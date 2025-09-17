import Sheet from "./Sheet.astro";
import SheetClose from "./SheetClose.astro";
import SheetContent, { sheetContent, sheetCloseButton } from "./SheetContent.astro";
import SheetDescription, { sheetDescription } from "./SheetDescription.astro";
import SheetFooter, { sheetFooter } from "./SheetFooter.astro";
import SheetHeader, { sheetHeader } from "./SheetHeader.astro";
import SheetOverlay, { sheetOverlay } from "./SheetOverlay.astro";
import SheetTitle, { sheetTitle } from "./SheetTitle.astro";
import SheetTrigger from "./SheetTrigger.astro";

const SheetVariants = {
  sheetContent,
  sheetCloseButton,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetOverlay,
  sheetTitle,
};

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
  SheetVariants,
};

export default {
  Root: Sheet,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Overlay: SheetOverlay,
  Header: SheetHeader,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
};
