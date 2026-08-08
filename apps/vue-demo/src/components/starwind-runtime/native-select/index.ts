import NativeSelect from "./NativeSelect.vue";
import NativeSelectOptGroup from "./NativeSelectOptGroup.vue";
import NativeSelectOption from "./NativeSelectOption.vue";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

export type { NativeSelectProps } from "./NativeSelect.vue";
export type { NativeSelectOptGroupProps } from "./NativeSelectOptGroup.vue";
export type { NativeSelectOptionProps } from "./NativeSelectOption.vue";

const NativeSelectVariants = { nativeSelect, nativeSelectIcon, nativeSelectWrapper };

const NativeSelectParts = {
  Root: NativeSelect,
  Option: NativeSelectOption,
  OptGroup: NativeSelectOptGroup,
};

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, NativeSelectVariants };

export default NativeSelectParts;
