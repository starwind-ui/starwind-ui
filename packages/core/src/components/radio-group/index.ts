import RadioGroup, { radioGroup } from "./RadioGroup.astro";
import RadioGroupItem, {
  radioControl,
  radioIndicator,
  radioItem,
  radioWrapper,
} from "./RadioGroupItem.astro";
import type { RadioGroupChangeEvent } from "./RadioGroupTypes";

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
