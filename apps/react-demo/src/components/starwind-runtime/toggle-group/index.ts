import ToggleGroup from "./ToggleGroup";
import ToggleGroupItem from "./ToggleGroupItem";
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
