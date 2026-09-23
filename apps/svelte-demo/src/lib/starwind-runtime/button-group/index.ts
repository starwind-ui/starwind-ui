import ButtonGroup from "./ButtonGroup.svelte";
import ButtonGroupSeparator from "./ButtonGroupSeparator.svelte";
import ButtonGroupText from "./ButtonGroupText.svelte";
import { buttonGroup, buttonGroupSeparator, buttonGroupText } from "./variants.js";
export type { ButtonGroupProps } from "./ButtonGroup.svelte";
export type { ButtonGroupSeparatorProps } from "./ButtonGroupSeparator.svelte";
export type { ButtonGroupTextProps } from "./ButtonGroupText.svelte";
const ButtonGroupVariants = { buttonGroup, buttonGroupSeparator, buttonGroupText };
const ButtonGroupParts = {
  Root: ButtonGroup,
  Separator: ButtonGroupSeparator,
  Text: ButtonGroupText,
};
export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, ButtonGroupVariants };
export default ButtonGroupParts;
