import Field from "./Field.astro";
import FieldContent from "./FieldContent.astro";
import FieldControl from "./FieldControl.astro";
import FieldDescription from "./FieldDescription.astro";
import FieldError from "./FieldError.astro";
import FieldGroup from "./FieldGroup.astro";
import FieldItem from "./FieldItem.astro";
import FieldLabel from "./FieldLabel.astro";
import FieldLegend from "./FieldLegend.astro";
import FieldSeparator from "./FieldSeparator.astro";
import FieldSet from "./FieldSet.astro";
import FieldTitle from "./FieldTitle.astro";
import FieldValidity from "./FieldValidity.astro";
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

export default {
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
