import Dropdown from "./Dropdown.astro";
import DropdownContent, { dropdownContent } from "./DropdownContent.astro";
import DropdownItem, { dropdownItem } from "./DropdownItem.astro";
import DropdownLabel, { dropdownLabel } from "./DropdownLabel.astro";
import DropdownSeparator, { dropdownSeparator } from "./DropdownSeparator.astro";
import DropdownShortcut from "./DropdownShortcut.astro";
import DropdownSub from "./DropdownSub.astro";
import DropdownSubContent from "./DropdownSubContent.astro";
import DropdownSubTrigger from "./DropdownSubTrigger.astro";
import DropdownTrigger, { dropdownTrigger } from "./DropdownTrigger.astro";

const DropdownVariants = {
  dropdownContent,
  dropdownItem,
  dropdownLabel,
  dropdownSeparator,
  dropdownTrigger,
};

export {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownShortcut,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
  DropdownVariants,
};

export default {
  Root: Dropdown,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Separator: DropdownSeparator,
  Shortcut: DropdownShortcut,
  Sub: DropdownSub,
  SubTrigger: DropdownSubTrigger,
  SubContent: DropdownSubContent,
};
