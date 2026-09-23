import Popover from "./Popover.svelte";
import PopoverTrigger from "./PopoverTrigger.svelte";
import PopoverContent from "./PopoverContent.svelte";
import PopoverHeader from "./PopoverHeader.svelte";
import PopoverTitle from "./PopoverTitle.svelte";
import PopoverDescription from "./PopoverDescription.svelte";
import {
  popover,
  popoverContent,
  popoverDescription,
  popoverHeader,
  popoverTitle,
  popoverTrigger,
} from "./variants.js";
export type { PopoverProps } from "./Popover.svelte";
export type { PopoverTriggerProps } from "./PopoverTrigger.svelte";
export type { PopoverContentProps } from "./PopoverContent.svelte";
export type { PopoverHeaderProps } from "./PopoverHeader.svelte";
export type { PopoverTitleProps } from "./PopoverTitle.svelte";
export type { PopoverDescriptionProps } from "./PopoverDescription.svelte";
const PopoverVariants = {
  popover,
  popoverContent,
  popoverDescription,
  popoverHeader,
  popoverTitle,
  popoverTrigger,
};
const PopoverParts = {
  Root: Popover,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Header: PopoverHeader,
  Title: PopoverTitle,
  Description: PopoverDescription,
};
export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  PopoverVariants,
};
export default PopoverParts;
