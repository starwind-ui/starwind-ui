import Dropdown from "./Dropdown.astro";
import DropdownCheckboxItem from "./DropdownCheckboxItem.astro";
import DropdownCheckboxItemIndicator from "./DropdownCheckboxItemIndicator.astro";
import DropdownContent from "./DropdownContent.astro";
import DropdownGroup from "./DropdownGroup.astro";
import DropdownItem from "./DropdownItem.astro";
import DropdownLabel from "./DropdownLabel.astro";
import DropdownRadioGroup from "./DropdownRadioGroup.astro";
import DropdownRadioItem from "./DropdownRadioItem.astro";
import DropdownRadioItemIndicator from "./DropdownRadioItemIndicator.astro";
import DropdownSeparator from "./DropdownSeparator.astro";
import DropdownShortcut from "./DropdownShortcut.astro";
import DropdownSub from "./DropdownSub.astro";
import DropdownSubContent from "./DropdownSubContent.astro";
import DropdownSubTrigger from "./DropdownSubTrigger.astro";
import DropdownTrigger from "./DropdownTrigger.astro";
import {
  dropdown,
  dropdownCheckboxItem,
  dropdownCheckboxItemIndicator,
  dropdownContent,
  dropdownItem,
  dropdownLabel,
  dropdownRadioGroup,
  dropdownRadioItem,
  dropdownRadioItemIndicator,
  dropdownSeparator,
  dropdownShortcut,
  dropdownTrigger,
} from "./variants";

const DropdownVariants = {
  dropdown,
  dropdownCheckboxItem,
  dropdownCheckboxItemIndicator,
  dropdownContent,
  dropdownItem,
  dropdownLabel,
  dropdownRadioGroup,
  dropdownRadioItem,
  dropdownRadioItemIndicator,
  dropdownSeparator,
  dropdownShortcut,
  dropdownTrigger,
};

export {
  Dropdown,
  DropdownCheckboxItem,
  DropdownCheckboxItemIndicator,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownRadioItemIndicator,
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
  CheckboxItem: DropdownCheckboxItem,
  CheckboxItemIndicator: DropdownCheckboxItemIndicator,
  RadioGroup: DropdownRadioGroup,
  RadioItem: DropdownRadioItem,
  RadioItemIndicator: DropdownRadioItemIndicator,
  Item: DropdownItem,
  Group: DropdownGroup,
  Label: DropdownLabel,
  Separator: DropdownSeparator,
  Shortcut: DropdownShortcut,
  Sub: DropdownSub,
  SubTrigger: DropdownSubTrigger,
  SubContent: DropdownSubContent,
};
