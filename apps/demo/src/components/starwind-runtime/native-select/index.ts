import NativeSelect from "./NativeSelect.astro";
import NativeSelectOptGroup from "./NativeSelectOptGroup.astro";
import NativeSelectOption from "./NativeSelectOption.astro";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

const NativeSelectVariants = {
  nativeSelect,
  nativeSelectIcon,
  nativeSelectWrapper,
};

const NativeSelectParts = {
  Root: NativeSelect,
  Option: NativeSelectOption,
  OptGroup: NativeSelectOptGroup,
};

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, NativeSelectVariants };

export default NativeSelectParts;
