import Sheet from "./Sheet";
import SheetClose from "./SheetClose";
import SheetContent from "./SheetContent";
import SheetDescription from "./SheetDescription";
import SheetFooter from "./SheetFooter";
import SheetHeader from "./SheetHeader";
import SheetTitle from "./SheetTitle";
import SheetTrigger from "./SheetTrigger";
import {
  sheetBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
} from "./variants";

const SheetVariants = {
  sheetBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
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
