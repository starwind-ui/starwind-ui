import Dropdown from "./Dropdown.vue";
import DropdownCheckboxItem from "./DropdownCheckboxItem.vue";
import DropdownCheckboxItemIndicator from "./DropdownCheckboxItemIndicator.vue";
import DropdownContent from "./DropdownContent.vue";
import DropdownGroup from "./DropdownGroup.vue";
import DropdownItem from "./DropdownItem.vue";
import DropdownLabel from "./DropdownLabel.vue";
import DropdownLinkItem from "./DropdownLinkItem.vue";
import DropdownRadioGroup from "./DropdownRadioGroup.vue";
import DropdownRadioItem from "./DropdownRadioItem.vue";
import DropdownRadioItemIndicator from "./DropdownRadioItemIndicator.vue";
import DropdownSeparator from "./DropdownSeparator.vue";
import DropdownShortcut from "./DropdownShortcut.vue";
import DropdownSub from "./DropdownSub.vue";
import DropdownSubContent from "./DropdownSubContent.vue";
import DropdownSubTrigger from "./DropdownSubTrigger.vue";
import DropdownTrigger from "./DropdownTrigger.vue";
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

export type { DropdownProps } from "./Dropdown.vue";
export type { DropdownCheckboxItemProps } from "./DropdownCheckboxItem.vue";
export type { DropdownCheckboxItemIndicatorProps } from "./DropdownCheckboxItemIndicator.vue";
export type { DropdownContentProps } from "./DropdownContent.vue";
export type { DropdownGroupProps } from "./DropdownGroup.vue";
export type { DropdownItemProps } from "./DropdownItem.vue";
export type { DropdownLabelProps } from "./DropdownLabel.vue";
export type { DropdownLinkItemProps } from "./DropdownLinkItem.vue";
export type { DropdownRadioGroupProps } from "./DropdownRadioGroup.vue";
export type { DropdownRadioItemProps } from "./DropdownRadioItem.vue";
export type { DropdownRadioItemIndicatorProps } from "./DropdownRadioItemIndicator.vue";
export type { DropdownSeparatorProps } from "./DropdownSeparator.vue";
export type { DropdownShortcutProps } from "./DropdownShortcut.vue";
export type { DropdownSubProps } from "./DropdownSub.vue";
export type { DropdownSubContentProps } from "./DropdownSubContent.vue";
export type { DropdownSubTriggerProps } from "./DropdownSubTrigger.vue";
export type { DropdownTriggerProps } from "./DropdownTrigger.vue";

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

const DropdownParts = {
  Root: Dropdown,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  CheckboxItem: DropdownCheckboxItem,
  CheckboxItemIndicator: DropdownCheckboxItemIndicator,
  RadioGroup: DropdownRadioGroup,
  RadioItem: DropdownRadioItem,
  RadioItemIndicator: DropdownRadioItemIndicator,
  Item: DropdownItem,
  LinkItem: DropdownLinkItem,
  Group: DropdownGroup,
  Label: DropdownLabel,
  Separator: DropdownSeparator,
  Shortcut: DropdownShortcut,
  Sub: DropdownSub,
  SubTrigger: DropdownSubTrigger,
  SubContent: DropdownSubContent,
};

export {
  Dropdown,
  DropdownCheckboxItem,
  DropdownCheckboxItemIndicator,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownLabel,
  DropdownLinkItem,
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

export default DropdownParts;
