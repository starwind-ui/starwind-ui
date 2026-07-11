import RadioGroup from "./RadioGroup.astro";
import RadioGroupItem from "./RadioGroupItem.astro";
import { radioControl, radioGroup, radioIndicator, radioItem, radioWrapper } from "./variants";

const RadioGroupVariants = {
  radioControl,
  radioGroup,
  radioIndicator,
  radioItem,
  radioWrapper,
};

export { RadioGroup, RadioGroupItem, RadioGroupVariants };

export default {
  Root: RadioGroup,
  Item: RadioGroupItem,
};
