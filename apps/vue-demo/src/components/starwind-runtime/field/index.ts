import Field from "./Field.vue";
import FieldContent from "./FieldContent.vue";
import FieldControl from "./FieldControl.vue";
import FieldDescription from "./FieldDescription.vue";
import FieldError from "./FieldError.vue";
import FieldGroup from "./FieldGroup.vue";
import FieldItem from "./FieldItem.vue";
import FieldLabel from "./FieldLabel.vue";
import FieldLegend from "./FieldLegend.vue";
import FieldSeparator from "./FieldSeparator.vue";
import FieldSet from "./FieldSet.vue";
import FieldTitle from "./FieldTitle.vue";
import FieldValidity from "./FieldValidity.vue";
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
} from "./variants";

export type { FieldProps } from "./Field.vue";
export type { FieldContentProps } from "./FieldContent.vue";
export type { FieldControlProps } from "./FieldControl.vue";
export type { FieldDescriptionProps } from "./FieldDescription.vue";
export type { FieldErrorProps } from "./FieldError.vue";
export type { FieldGroupProps } from "./FieldGroup.vue";
export type { FieldItemProps } from "./FieldItem.vue";
export type { FieldLabelProps } from "./FieldLabel.vue";
export type { FieldLegendProps } from "./FieldLegend.vue";
export type { FieldSeparatorProps } from "./FieldSeparator.vue";
export type { FieldSetProps } from "./FieldSet.vue";
export type { FieldTitleProps } from "./FieldTitle.vue";
export type { FieldValidityProps } from "./FieldValidity.vue";

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
