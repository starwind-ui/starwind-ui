import ButtonGroup from "./ButtonGroup.astro";
import ButtonGroupSeparator from "./ButtonGroupSeparator.astro";
import ButtonGroupText from "./ButtonGroupText.astro";
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
