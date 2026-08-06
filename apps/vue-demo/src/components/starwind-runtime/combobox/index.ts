import Combobox from "./Combobox.vue";
import ComboboxClear from "./ComboboxClear.vue";
import ComboboxContent from "./ComboboxContent.vue";
import ComboboxEmpty from "./ComboboxEmpty.vue";
import ComboboxGroup from "./ComboboxGroup.vue";
import ComboboxGroupLabel from "./ComboboxGroupLabel.vue";
import ComboboxInput from "./ComboboxInput.vue";
import ComboboxInputGroup from "./ComboboxInputGroup.vue";
import ComboboxItem from "./ComboboxItem.vue";
import ComboboxItemIndicator from "./ComboboxItemIndicator.vue";
import ComboboxItemText from "./ComboboxItemText.vue";
import ComboboxLabel from "./ComboboxLabel.vue";
import ComboboxSeparator from "./ComboboxSeparator.vue";
import ComboboxTrigger from "./ComboboxTrigger.vue";
import ComboboxValue from "./ComboboxValue.vue";
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

export type { ComboboxProps } from "./Combobox.vue";
export type { ComboboxClearProps } from "./ComboboxClear.vue";
export type { ComboboxContentProps } from "./ComboboxContent.vue";
export type { ComboboxEmptyProps } from "./ComboboxEmpty.vue";
export type { ComboboxGroupProps } from "./ComboboxGroup.vue";
export type { ComboboxGroupLabelProps } from "./ComboboxGroupLabel.vue";
export type { ComboboxInputProps } from "./ComboboxInput.vue";
export type { ComboboxInputGroupProps } from "./ComboboxInputGroup.vue";
export type { ComboboxItemProps } from "./ComboboxItem.vue";
export type { ComboboxItemIndicatorProps } from "./ComboboxItemIndicator.vue";
export type { ComboboxItemTextProps } from "./ComboboxItemText.vue";
export type { ComboboxLabelProps } from "./ComboboxLabel.vue";
export type { ComboboxSeparatorProps } from "./ComboboxSeparator.vue";
export type { ComboboxTriggerProps } from "./ComboboxTrigger.vue";
export type { ComboboxValueProps } from "./ComboboxValue.vue";

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
