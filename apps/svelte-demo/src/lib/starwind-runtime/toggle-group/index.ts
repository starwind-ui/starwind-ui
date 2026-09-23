import ToggleGroup from "./ToggleGroup.svelte";
import ToggleGroupItem from "./ToggleGroupItem.svelte";
import { toggleGroup, toggleGroupItem } from "./variants.js";
export type { ToggleGroupProps } from "./ToggleGroup.svelte";
export type { ToggleGroupItemProps } from "./ToggleGroupItem.svelte";
const ToggleGroupVariants = { toggleGroup, toggleGroupItem };
const ToggleGroupParts = { Root: ToggleGroup, Item: ToggleGroupItem };
export { ToggleGroup, ToggleGroupItem, ToggleGroupVariants };
export default ToggleGroupParts;
