import Popover, { popover } from "./Popover.astro";
import PopoverContent, { popoverContent } from "./PopoverContent.astro";
import PopoverDescription, { popoverDescription } from "./PopoverDescription.astro";
import PopoverHeader, { popoverHeader } from "./PopoverHeader.astro";
import PopoverTitle, { popoverTitle } from "./PopoverTitle.astro";
import PopoverTrigger, { popoverTrigger } from "./PopoverTrigger.astro";

const PopoverVariants = {
  popover,
  popoverContent,
  popoverDescription,
  popoverHeader,
  popoverTitle,
  popoverTrigger,
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

export default {
  Root: Popover,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Header: PopoverHeader,
  Title: PopoverTitle,
  Description: PopoverDescription,
};
