import Popover from "./Popover";
import PopoverContent from "./PopoverContent";
import PopoverDescription from "./PopoverDescription";
import PopoverHeader from "./PopoverHeader";
import PopoverTitle from "./PopoverTitle";
import PopoverTrigger from "./PopoverTrigger";
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
