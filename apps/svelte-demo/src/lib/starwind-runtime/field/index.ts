import Field from "./Field.svelte";
import FieldSet from "./FieldSet.svelte";
import FieldLegend from "./FieldLegend.svelte";
import FieldGroup from "./FieldGroup.svelte";
import FieldContent from "./FieldContent.svelte";
import FieldTitle from "./FieldTitle.svelte";
import FieldLabel from "./FieldLabel.svelte";
import FieldControl from "./FieldControl.svelte";
import FieldDescription from "./FieldDescription.svelte";
import FieldError from "./FieldError.svelte";
import FieldValidity from "./FieldValidity.svelte";
import FieldItem from "./FieldItem.svelte";
import FieldSeparator from "./FieldSeparator.svelte";
import {
  field,
  fieldContent,
  fieldControl,
  fieldDescription,
  fieldError,
  fieldGroup,
  fieldItem,
  fieldLabel,
  fieldLegend,
  fieldSeparator,
  fieldSeparatorContent,
  fieldSet,
  fieldTitle,
  fieldValidity,
} from "./variants.js";
export type { FieldProps } from "./Field.svelte";
export type { FieldSetProps } from "./FieldSet.svelte";
export type { FieldLegendProps } from "./FieldLegend.svelte";
export type { FieldGroupProps } from "./FieldGroup.svelte";
export type { FieldContentProps } from "./FieldContent.svelte";
export type { FieldTitleProps } from "./FieldTitle.svelte";
export type { FieldLabelProps } from "./FieldLabel.svelte";
export type { FieldControlProps } from "./FieldControl.svelte";
export type { FieldDescriptionProps } from "./FieldDescription.svelte";
export type { FieldErrorProps } from "./FieldError.svelte";
export type { FieldValidityProps } from "./FieldValidity.svelte";
export type { FieldItemProps } from "./FieldItem.svelte";
export type { FieldSeparatorProps } from "./FieldSeparator.svelte";
const FieldVariants = {
  field,
  fieldContent,
  fieldControl,
  fieldDescription,
  fieldError,
  fieldGroup,
  fieldItem,
  fieldLabel,
  fieldLegend,
  fieldSeparator,
  fieldSeparatorContent,
  fieldSet,
  fieldTitle,
  fieldValidity,
};
const FieldParts = {
  Content: FieldContent,
  Control: FieldControl,
  Description: FieldDescription,
  Error: FieldError,
  Group: FieldGroup,
  Item: FieldItem,
  Label: FieldLabel,
  Legend: FieldLegend,
  Root: Field,
  Separator: FieldSeparator,
  Set: FieldSet,
  Title: FieldTitle,
  Validity: FieldValidity,
};
export {
  Field,
  FieldContent,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldItem,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  FieldValidity,
  FieldVariants,
};
export default FieldParts;
