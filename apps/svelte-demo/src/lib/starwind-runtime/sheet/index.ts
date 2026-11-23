import Sheet from "./Sheet.svelte";
import SheetClose from "./SheetClose.svelte";
import SheetContent from "./SheetContent.svelte";
import SheetDescription from "./SheetDescription.svelte";
import SheetFooter from "./SheetFooter.svelte";
import SheetHeader from "./SheetHeader.svelte";
import SheetTitle from "./SheetTitle.svelte";
import SheetTrigger from "./SheetTrigger.svelte";
import {
  sheetBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
} from "./variants.js";

export type { SheetProps } from "./Sheet.svelte";
export type { SheetCloseProps } from "./SheetClose.svelte";
export type { SheetContentProps } from "./SheetContent.svelte";
export type { SheetDescriptionProps } from "./SheetDescription.svelte";
export type { SheetFooterProps } from "./SheetFooter.svelte";
export type { SheetHeaderProps } from "./SheetHeader.svelte";
export type { SheetTitleProps } from "./SheetTitle.svelte";
export type { SheetTriggerProps } from "./SheetTrigger.svelte";

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
