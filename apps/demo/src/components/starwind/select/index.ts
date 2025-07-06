import Select from "./Select.astro";
import SelectContent from "./SelectContent.astro";
import SelectGroup from "./SelectGroup.astro";
import SelectItem from "./SelectItem.astro";
import SelectLabel from "./SelectLabel.astro";
import SelectSeparator from "./SelectSeparator.astro";
import SelectTrigger from "./SelectTrigger.astro";
import type { SelectChangeEvent, SelectEvent } from "./SelectTypes";
import SelectValue from "./SelectValue.astro";

export {
  Select,
  type SelectChangeEvent,
  SelectContent,
  type SelectEvent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

export default {
  Root: Select,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Group: SelectGroup,
  Label: SelectLabel,
  Item: SelectItem,
  Separator: SelectSeparator,
};
