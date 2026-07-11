import NativeSelect from "./NativeSelect";
import NativeSelectOptGroup from "./NativeSelectOptGroup";
import NativeSelectOption from "./NativeSelectOption";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

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
