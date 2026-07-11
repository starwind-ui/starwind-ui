import RadioGroup from "./RadioGroup";
import RadioGroupItem from "./RadioGroupItem";
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
