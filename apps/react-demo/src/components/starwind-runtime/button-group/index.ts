import ButtonGroup from "./ButtonGroup";
import ButtonGroupSeparator from "./ButtonGroupSeparator";
import ButtonGroupText from "./ButtonGroupText";
import { buttonGroup, buttonGroupSeparator, buttonGroupText } from "./variants";

const ButtonGroupVariants = {
  buttonGroup,
  buttonGroupSeparator,
  buttonGroupText,
};

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, ButtonGroupVariants };

export default {
  Root: ButtonGroup,
  Separator: ButtonGroupSeparator,
  Text: ButtonGroupText,
};
