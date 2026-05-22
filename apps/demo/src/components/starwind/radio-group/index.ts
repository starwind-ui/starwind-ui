import RadioGroup from "./RadioGroup.astro";
import RadioGroupItem from "./RadioGroupItem.astro";
import type { RadioGroupChangeEvent } from "./RadioGroupTypes";
import { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper } from "./variants";

const RadioGroupVariants = {
  radioGroup,
  radioWrapper,
  radioItem,
  radioControl,
  radioIndicator,
};

export { RadioGroup, type RadioGroupChangeEvent, RadioGroupItem, RadioGroupVariants };

export default {
  Root: RadioGroup,
  Item: RadioGroupItem,
};
