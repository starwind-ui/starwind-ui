import Sheet from "./Sheet.vue";
import SheetClose from "./SheetClose.vue";
import SheetContent from "./SheetContent.vue";
import SheetDescription from "./SheetDescription.vue";
import SheetFooter from "./SheetFooter.vue";
import SheetHeader from "./SheetHeader.vue";
import SheetTitle from "./SheetTitle.vue";
import SheetTrigger from "./SheetTrigger.vue";
import {
  sheetBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
} from "./variants";

export type { SheetProps } from "./Sheet.vue";
export type { SheetCloseProps } from "./SheetClose.vue";
export type { SheetContentProps } from "./SheetContent.vue";
export type { SheetDescriptionProps } from "./SheetDescription.vue";
export type { SheetFooterProps } from "./SheetFooter.vue";
export type { SheetHeaderProps } from "./SheetHeader.vue";
export type { SheetTitleProps } from "./SheetTitle.vue";
export type { SheetTriggerProps } from "./SheetTrigger.vue";

const SheetVariants = {
  sheetBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
};

const SheetParts = {
  Root: Sheet,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header: SheetHeader,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
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

export default SheetParts;
