import Field from "./Field";
import FieldContent from "./FieldContent";
import FieldControl from "./FieldControl";
import FieldDescription from "./FieldDescription";
import FieldError from "./FieldError";
import FieldGroup from "./FieldGroup";
import FieldItem from "./FieldItem";
import FieldLabel from "./FieldLabel";
import FieldLegend from "./FieldLegend";
import FieldSeparator from "./FieldSeparator";
import FieldSet from "./FieldSet";
import FieldTitle from "./FieldTitle";
import FieldValidity from "./FieldValidity";
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
