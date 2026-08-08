"use client";

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

const RadioGroupParts = {
  Root: RadioGroup,
  Item: RadioGroupItem,
};

export { RadioGroup, RadioGroupItem, RadioGroupVariants };

export default RadioGroupParts;
