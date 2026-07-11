import Select from "./Select";
import SelectContent from "./SelectContent";
import SelectGroup from "./SelectGroup";
import SelectItem from "./SelectItem";
import SelectItemIndicator from "./SelectItemIndicator";
import SelectItemText from "./SelectItemText";
import SelectLabel from "./SelectLabel";
import SelectScrollDownButton from "./SelectScrollDownButton";
import SelectScrollUpButton from "./SelectScrollUpButton";
import SelectSeparator from "./SelectSeparator";
import SelectTrigger from "./SelectTrigger";
import SelectValue from "./SelectValue";
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
