import Select from "./Select.vue";
import SelectContent from "./SelectContent.vue";
import SelectGroup from "./SelectGroup.vue";
import SelectItem from "./SelectItem.vue";
import SelectItemIndicator from "./SelectItemIndicator.vue";
import SelectItemText from "./SelectItemText.vue";
import SelectLabel from "./SelectLabel.vue";
import SelectScrollDownButton from "./SelectScrollDownButton.vue";
import SelectScrollUpButton from "./SelectScrollUpButton.vue";
import SelectSeparator from "./SelectSeparator.vue";
import SelectTrigger from "./SelectTrigger.vue";
import SelectValue from "./SelectValue.vue";
import {
  select,
  selectContent,
  selectGroup,
  selectItem,
  selectItemIndicator,
  selectItemText,
  selectLabel,
  selectList,
  selectScrollButton,
  selectSeparator,
  selectTrigger,
  selectValue,
} from "./variants";

export type { SelectProps } from "./Select.vue";
export type { SelectContentProps } from "./SelectContent.vue";
export type { SelectGroupProps } from "./SelectGroup.vue";
export type { SelectItemProps } from "./SelectItem.vue";
export type { SelectItemIndicatorProps } from "./SelectItemIndicator.vue";
export type { SelectItemTextProps } from "./SelectItemText.vue";
export type { SelectLabelProps } from "./SelectLabel.vue";
export type { SelectScrollDownButtonProps } from "./SelectScrollDownButton.vue";
export type { SelectScrollUpButtonProps } from "./SelectScrollUpButton.vue";
export type { SelectSeparatorProps } from "./SelectSeparator.vue";
export type { SelectTriggerProps } from "./SelectTrigger.vue";
export type { SelectValueProps } from "./SelectValue.vue";

const SelectVariants = {
  select,
  selectContent,
  selectGroup,
  selectItem,
  selectItemIndicator,
  selectItemText,
  selectLabel,
  selectList,
  selectScrollButton,
  selectSeparator,
  selectTrigger,
  selectValue,
};

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectVariants,
};

export default {
  Root: Select,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Group: SelectGroup,
  Label: SelectLabel,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Separator: SelectSeparator,
  ScrollUpButton: SelectScrollUpButton,
  ScrollDownButton: SelectScrollDownButton,
};
