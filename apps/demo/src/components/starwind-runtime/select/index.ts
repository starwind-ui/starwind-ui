import Select from "./Select.astro";
import SelectContent from "./SelectContent.astro";
import SelectGroup from "./SelectGroup.astro";
import SelectItem from "./SelectItem.astro";
import SelectItemIndicator from "./SelectItemIndicator.astro";
import SelectItemText from "./SelectItemText.astro";
import SelectLabel from "./SelectLabel.astro";
import SelectScrollDownButton from "./SelectScrollDownButton.astro";
import SelectScrollUpButton from "./SelectScrollUpButton.astro";
import SelectSeparator from "./SelectSeparator.astro";
import SelectTrigger from "./SelectTrigger.astro";
import SelectValue from "./SelectValue.astro";
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
