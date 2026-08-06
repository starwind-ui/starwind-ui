import ButtonGroup from "./ButtonGroup.vue";
import ButtonGroupSeparator from "./ButtonGroupSeparator.vue";
import ButtonGroupText from "./ButtonGroupText.vue";
import { buttonGroup, buttonGroupSeparator, buttonGroupText } from "./variants";

export type { ButtonGroupProps } from "./ButtonGroup.vue";
export type { ButtonGroupSeparatorProps } from "./ButtonGroupSeparator.vue";
export type { ButtonGroupTextProps } from "./ButtonGroupText.vue";

const ButtonGroupVariants = { buttonGroup, buttonGroupSeparator, buttonGroupText };

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, ButtonGroupVariants };

export default { Root: ButtonGroup, Separator: ButtonGroupSeparator, Text: ButtonGroupText };
