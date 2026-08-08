import Popover from "./Popover.astro";
import PopoverContent from "./PopoverContent.astro";
import PopoverDescription from "./PopoverDescription.astro";
import PopoverHeader from "./PopoverHeader.astro";
import PopoverTitle from "./PopoverTitle.astro";
import PopoverTrigger from "./PopoverTrigger.astro";
import {
  popover,
  popoverContent,
  popoverDescription,
  popoverHeader,
  popoverTitle,
  popoverTrigger,
} from "./variants";

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
