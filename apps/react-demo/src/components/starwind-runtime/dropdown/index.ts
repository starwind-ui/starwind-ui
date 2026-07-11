import Dropdown from "./Dropdown";
import DropdownCheckboxItem from "./DropdownCheckboxItem";
import DropdownCheckboxItemIndicator from "./DropdownCheckboxItemIndicator";
import DropdownContent from "./DropdownContent";
import DropdownGroup from "./DropdownGroup";
import DropdownItem from "./DropdownItem";
import DropdownLabel from "./DropdownLabel";
import DropdownRadioGroup from "./DropdownRadioGroup";
import DropdownRadioItem from "./DropdownRadioItem";
import DropdownRadioItemIndicator from "./DropdownRadioItemIndicator";
import DropdownSeparator from "./DropdownSeparator";
import DropdownShortcut from "./DropdownShortcut";
import DropdownSub from "./DropdownSub";
import DropdownSubContent from "./DropdownSubContent";
import DropdownSubTrigger from "./DropdownSubTrigger";
import DropdownTrigger from "./DropdownTrigger";
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
