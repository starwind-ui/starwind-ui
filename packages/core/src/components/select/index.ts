import Select from "./Select.astro";
import SelectContent from "./SelectContent.astro";
import SelectGroup from "./SelectGroup.astro";
import SelectItem from "./SelectItem.astro";
import SelectLabel from "./SelectLabel.astro";
import SelectSearch from "./SelectSearch.astro";
import SelectSeparator from "./SelectSeparator.astro";
import SelectTrigger from "./SelectTrigger.astro";
import type { SelectChangeEvent, SelectEvent } from "./SelectTypes";
import SelectValue from "./SelectValue.astro";
import {
  selectContent,
  selectContentInner,
  selectItem,
  selectItemIcon,
  selectLabel,
  selectSearch,
  selectSeparator,
  selectTrigger,
  selectValue,
} from "./variants";
const SelectVariants = {
  selectContent,
  selectContentInner,
  selectItem,
  selectItemIcon,
  selectLabel,
  selectSearch,
  selectSeparator,
  selectTrigger,
  selectValue,
};

export {
  Select,
  type SelectChangeEvent,
  SelectContent,
  type SelectEvent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSearch,
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
  Search: SelectSearch,
  Item: SelectItem,
  Separator: SelectSeparator,
};
