import NativeSelect from "./NativeSelect.svelte";
import NativeSelectOption from "./NativeSelectOption.svelte";
import NativeSelectOptGroup from "./NativeSelectOptGroup.svelte";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants.js";
export type { NativeSelectProps } from "./NativeSelect.svelte";
export type { NativeSelectOptionProps } from "./NativeSelectOption.svelte";
export type { NativeSelectOptGroupProps } from "./NativeSelectOptGroup.svelte";
const NativeSelectVariants = { nativeSelect, nativeSelectIcon, nativeSelectWrapper };
const NativeSelectParts = {
  Root: NativeSelect,
  Option: NativeSelectOption,
  OptGroup: NativeSelectOptGroup,
};
export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, NativeSelectVariants };
export default NativeSelectParts;
