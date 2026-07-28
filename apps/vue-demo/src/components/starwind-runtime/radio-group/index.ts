import RadioGroup from "./RadioGroup.vue";
import RadioGroupItem from "./RadioGroupItem.vue";
import { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper } from "./variants";

export type { RadioGroupProps } from "./RadioGroup.vue";
export type { RadioGroupItemProps } from "./RadioGroupItem.vue";

const RadioGroupVariants = { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper };

export { RadioGroup, RadioGroupItem, RadioGroupVariants };

export default { Root: RadioGroup, Item: RadioGroupItem };
