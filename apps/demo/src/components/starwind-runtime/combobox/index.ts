import Combobox from "./Combobox.astro";
import ComboboxClear from "./ComboboxClear.astro";
import ComboboxContent from "./ComboboxContent.astro";
import ComboboxEmpty from "./ComboboxEmpty.astro";
import ComboboxGroup from "./ComboboxGroup.astro";
import ComboboxGroupLabel from "./ComboboxGroupLabel.astro";
import ComboboxInput from "./ComboboxInput.astro";
import ComboboxInputGroup from "./ComboboxInputGroup.astro";
import ComboboxItem from "./ComboboxItem.astro";
import ComboboxItemIndicator from "./ComboboxItemIndicator.astro";
import ComboboxItemText from "./ComboboxItemText.astro";
import ComboboxLabel from "./ComboboxLabel.astro";
import ComboboxSeparator from "./ComboboxSeparator.astro";
import ComboboxTrigger from "./ComboboxTrigger.astro";
import ComboboxValue from "./ComboboxValue.astro";
import {
  combobox,
  comboboxClear,
  comboboxContent,
  comboboxEmpty,
  comboboxGroup,
  comboboxGroupLabel,
  comboboxInput,
  comboboxInputGroup,
  comboboxItem,
  comboboxItemIndicator,
  comboboxItemText,
  comboboxLabel,
  comboboxList,
  comboboxSeparator,
  comboboxTrigger,
  comboboxValue,
} from "./variants";

const ComboboxVariants = {
  combobox,
  comboboxClear,
  comboboxContent,
  comboboxEmpty,
  comboboxGroup,
  comboboxGroupLabel,
  comboboxInput,
  comboboxInputGroup,
  comboboxItem,
  comboboxItemIndicator,
  comboboxItemText,
  comboboxLabel,
  comboboxList,
  comboboxSeparator,
  comboboxTrigger,
  comboboxValue,
};

export {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxVariants,
};

export default {
  Root: Combobox,
  Label: ComboboxLabel,
  InputGroup: ComboboxInputGroup,
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  Clear: ComboboxClear,
  Value: ComboboxValue,
  Content: ComboboxContent,
  Empty: ComboboxEmpty,
  Group: ComboboxGroup,
  GroupLabel: ComboboxGroupLabel,
  Item: ComboboxItem,
  ItemText: ComboboxItemText,
  ItemIndicator: ComboboxItemIndicator,
  Separator: ComboboxSeparator,
};
