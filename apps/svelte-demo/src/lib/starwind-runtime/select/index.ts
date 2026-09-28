import Select from "./Select.svelte";
import SelectTrigger from "./SelectTrigger.svelte";
import SelectValue from "./SelectValue.svelte";
import SelectContent from "./SelectContent.svelte";
import SelectItem from "./SelectItem.svelte";
import SelectItemText from "./SelectItemText.svelte";
import SelectItemIndicator from "./SelectItemIndicator.svelte";
import SelectGroup from "./SelectGroup.svelte";
import SelectLabel from "./SelectLabel.svelte";
import SelectSeparator from "./SelectSeparator.svelte";
import SelectScrollUpButton from "./SelectScrollUpButton.svelte";
import SelectScrollDownButton from "./SelectScrollDownButton.svelte";
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
} from "./variants.js";
export type { SelectProps } from "./Select.svelte";
export type { SelectTriggerProps } from "./SelectTrigger.svelte";
export type { SelectValueProps } from "./SelectValue.svelte";
export type { SelectContentProps } from "./SelectContent.svelte";
export type { SelectItemProps } from "./SelectItem.svelte";
export type { SelectItemTextProps } from "./SelectItemText.svelte";
export type { SelectItemIndicatorProps } from "./SelectItemIndicator.svelte";
export type { SelectGroupProps } from "./SelectGroup.svelte";
export type { SelectLabelProps } from "./SelectLabel.svelte";
export type { SelectSeparatorProps } from "./SelectSeparator.svelte";
export type { SelectScrollUpButtonProps } from "./SelectScrollUpButton.svelte";
export type { SelectScrollDownButtonProps } from "./SelectScrollDownButton.svelte";
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
const SelectParts = {
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
export default SelectParts;
