import ToggleGroup from "./ToggleGroup.astro";
import ToggleGroupItem from "./ToggleGroupItem.astro";
import { toggleGroup, toggleGroupItem } from "./variants";

const ToggleGroupVariants = {
  toggleGroup,
  toggleGroupItem,
};

const ToggleGroupParts = {
  Root: ToggleGroup,
  Item: ToggleGroupItem,
};

export { ToggleGroup, ToggleGroupItem, ToggleGroupVariants };

export default ToggleGroupParts;
