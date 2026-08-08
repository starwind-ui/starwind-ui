"use client";

import ToggleGroup from "./ToggleGroup";
import ToggleGroupItem from "./ToggleGroupItem";
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
