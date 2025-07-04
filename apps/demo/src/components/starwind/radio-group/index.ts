import RadioGroup from "./RadioGroup.astro";
import RadioGroupItem from "./RadioGroupItem.astro";
import type { RadioGroupChangeEvent } from "./RadioGroupTypes";

export { RadioGroup, type RadioGroupChangeEvent, RadioGroupItem };

export default {
  Root: RadioGroup,
  Item: RadioGroupItem,
};
