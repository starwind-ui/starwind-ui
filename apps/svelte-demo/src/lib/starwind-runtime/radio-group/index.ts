import RadioGroup from "./RadioGroup.svelte";
import RadioGroupItem from "./RadioGroupItem.svelte";
import { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper } from "./variants.js";
export type { RadioGroupProps } from "./RadioGroup.svelte";
export type { RadioGroupItemProps } from "./RadioGroupItem.svelte";
const RadioGroupVariants = { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper };
const RadioGroupParts = { Root: RadioGroup, Item: RadioGroupItem };
export { RadioGroup, RadioGroupItem, RadioGroupVariants };
export default RadioGroupParts;
