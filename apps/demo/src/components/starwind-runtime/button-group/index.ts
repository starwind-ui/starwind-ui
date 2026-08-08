import ButtonGroup from "./ButtonGroup.astro";
import ButtonGroupSeparator from "./ButtonGroupSeparator.astro";
import ButtonGroupText from "./ButtonGroupText.astro";
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
