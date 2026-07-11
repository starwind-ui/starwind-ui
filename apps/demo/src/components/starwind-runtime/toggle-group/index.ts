import ToggleGroup from "./ToggleGroup.astro";
import ToggleGroupItem from "./ToggleGroupItem.astro";
import { toggleGroup, toggleGroupItem } from "./variants";

const ToggleGroupVariants = {
  toggleGroup,
  toggleGroupItem,
};

export { ToggleGroup, ToggleGroupItem, ToggleGroupVariants };

export default {
  Root: ToggleGroup,
  Item: ToggleGroupItem,
};
