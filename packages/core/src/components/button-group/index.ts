import ButtonGroup, { buttonGroup } from "./ButtonGroup.astro";
import ButtonGroupSeparator, { buttonGroupSeparator } from "./ButtonGroupSeparator.astro";
import ButtonGroupText, { buttonGroupText } from "./ButtonGroupText.astro";

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
