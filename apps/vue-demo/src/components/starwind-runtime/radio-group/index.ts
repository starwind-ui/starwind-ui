import RadioGroup from "./RadioGroup.vue";
import RadioGroupItem from "./RadioGroupItem.vue";
import { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper } from "./variants";

export type { RadioGroupProps } from "./RadioGroup.vue";
export type { RadioGroupItemProps } from "./RadioGroupItem.vue";

const RadioGroupVariants = { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper };

const RadioGroupParts = { Root: RadioGroup, Item: RadioGroupItem };

export { RadioGroup, RadioGroupItem, RadioGroupVariants };

export default RadioGroupParts;
