import NativeSelect from "./NativeSelect.svelte";
import NativeSelectOptGroup from "./NativeSelectOptGroup.svelte";
import NativeSelectOption from "./NativeSelectOption.svelte";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants.js";

export type { NativeSelectProps } from "./NativeSelect.svelte";
export type { NativeSelectOptGroupProps } from "./NativeSelectOptGroup.svelte";
export type { NativeSelectOptionProps } from "./NativeSelectOption.svelte";

const NativeSelectVariants = { nativeSelect, nativeSelectIcon, nativeSelectWrapper };
const NativeSelectParts = {
  Root: NativeSelect,
  Option: NativeSelectOption,
  OptGroup: NativeSelectOptGroup,
};

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, NativeSelectVariants };
export default NativeSelectParts;
