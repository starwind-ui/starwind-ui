import Select from "./Select.astro";
import SelectContent, { selectContent, selectContentInner } from "./SelectContent.astro";
import SelectGroup from "./SelectGroup.astro";
import SelectItem, { selectItem, selectItemIcon } from "./SelectItem.astro";
import SelectLabel, { selectLabel } from "./SelectLabel.astro";
import SelectSearch, { selectSearch } from "./SelectSearch.astro";
import SelectSeparator, { selectSeparator } from "./SelectSeparator.astro";
import SelectTrigger, { selectTrigger } from "./SelectTrigger.astro";
import type { SelectChangeEvent, SelectEvent } from "./SelectTypes";
import SelectValue, { selectValue } from "./SelectValue.astro";

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
