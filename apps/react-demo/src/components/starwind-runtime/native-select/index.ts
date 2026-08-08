import NativeSelect from "./NativeSelect";
import NativeSelectOptGroup from "./NativeSelectOptGroup";
import NativeSelectOption from "./NativeSelectOption";
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
