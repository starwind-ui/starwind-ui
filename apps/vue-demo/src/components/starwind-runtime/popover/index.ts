import Popover from "./Popover.vue";
import PopoverContent from "./PopoverContent.vue";
import PopoverDescription from "./PopoverDescription.vue";
import PopoverHeader from "./PopoverHeader.vue";
import PopoverTitle from "./PopoverTitle.vue";
import PopoverTrigger from "./PopoverTrigger.vue";
import {
  popover,
  popoverContent,
  popoverDescription,
  popoverHeader,
  popoverTitle,
  popoverTrigger,
} from "./variants";

export type { PopoverProps } from "./Popover.vue";
export type { PopoverContentProps } from "./PopoverContent.vue";
export type { PopoverDescriptionProps } from "./PopoverDescription.vue";
export type { PopoverHeaderProps } from "./PopoverHeader.vue";
export type { PopoverTitleProps } from "./PopoverTitle.vue";
export type { PopoverTriggerProps } from "./PopoverTrigger.vue";

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
