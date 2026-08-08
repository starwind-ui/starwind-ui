import ButtonGroup from "./ButtonGroup";
import ButtonGroupSeparator from "./ButtonGroupSeparator";
import ButtonGroupText from "./ButtonGroupText";
import { buttonGroup, buttonGroupSeparator, buttonGroupText } from "./variants";

const ButtonGroupVariants = {
  buttonGroup,
  buttonGroupSeparator,
  buttonGroupText,
};

const ButtonGroupParts = {
  Root: ButtonGroup,
  Separator: ButtonGroupSeparator,
  Text: ButtonGroupText,
};

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, ButtonGroupVariants };

export default ButtonGroupParts;
