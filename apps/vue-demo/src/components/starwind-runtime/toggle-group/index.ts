import ToggleGroup from "./ToggleGroup.vue";
import ToggleGroupItem from "./ToggleGroupItem.vue";
import { toggleGroup, toggleGroupItem } from "./variants";

export type { ToggleGroupProps } from "./ToggleGroup.vue";
export type { ToggleGroupItemProps } from "./ToggleGroupItem.vue";

const ToggleGroupVariants = { toggleGroup, toggleGroupItem };

export { ToggleGroup, ToggleGroupItem, ToggleGroupVariants };

export default { Root: ToggleGroup, Item: ToggleGroupItem };
