import Combobox from "./Combobox.svelte";
import ComboboxLabel from "./ComboboxLabel.svelte";
import ComboboxInputGroup from "./ComboboxInputGroup.svelte";
import ComboboxInput from "./ComboboxInput.svelte";
import ComboboxTrigger from "./ComboboxTrigger.svelte";
import ComboboxClear from "./ComboboxClear.svelte";
import ComboboxValue from "./ComboboxValue.svelte";
import ComboboxContent from "./ComboboxContent.svelte";
import ComboboxEmpty from "./ComboboxEmpty.svelte";
import ComboboxItem from "./ComboboxItem.svelte";
import ComboboxItemText from "./ComboboxItemText.svelte";
import ComboboxItemIndicator from "./ComboboxItemIndicator.svelte";
import ComboboxGroup from "./ComboboxGroup.svelte";
import ComboboxGroupLabel from "./ComboboxGroupLabel.svelte";
import ComboboxSeparator from "./ComboboxSeparator.svelte";
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
} from "./variants.js";
export type { ComboboxProps } from "./Combobox.svelte";
export type { ComboboxLabelProps } from "./ComboboxLabel.svelte";
export type { ComboboxInputGroupProps } from "./ComboboxInputGroup.svelte";
export type { ComboboxInputProps } from "./ComboboxInput.svelte";
export type { ComboboxTriggerProps } from "./ComboboxTrigger.svelte";
export type { ComboboxClearProps } from "./ComboboxClear.svelte";
export type { ComboboxValueProps } from "./ComboboxValue.svelte";
export type { ComboboxContentProps } from "./ComboboxContent.svelte";
export type { ComboboxEmptyProps } from "./ComboboxEmpty.svelte";
export type { ComboboxItemProps } from "./ComboboxItem.svelte";
export type { ComboboxItemTextProps } from "./ComboboxItemText.svelte";
export type { ComboboxItemIndicatorProps } from "./ComboboxItemIndicator.svelte";
export type { ComboboxGroupProps } from "./ComboboxGroup.svelte";
export type { ComboboxGroupLabelProps } from "./ComboboxGroupLabel.svelte";
export type { ComboboxSeparatorProps } from "./ComboboxSeparator.svelte";
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
const ComboboxParts = {
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
export default ComboboxParts;
