import NativeSelect, {
  nativeSelect,
  nativeSelectIcon,
  nativeSelectWrapper,
} from "./NativeSelect.astro";
import NativeSelectOptGroup from "./NativeSelectOptGroup.astro";
import NativeSelectOption from "./NativeSelectOption.astro";

const NativeSelectVariants = {
  nativeSelect,
  nativeSelectIcon,
  nativeSelectWrapper,
};

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, NativeSelectVariants };

export default {
  Root: NativeSelect,
  Option: NativeSelectOption,
  OptGroup: NativeSelectOptGroup,
};
