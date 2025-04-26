import Dropdown from "./Dropdown.astro";
import DropdownTrigger from "./DropdownTrigger.astro";
import DropdownContent from "./DropdownContent.astro";
import DropdownItem from "./DropdownItem.astro";
import DropdownLabel from "./DropdownLabel.astro";
import DropdownSeparator from "./DropdownSeparator.astro";

export {
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownLabel,
	DropdownSeparator,
};

export default {
	Root: Dropdown,
	Trigger: DropdownTrigger,
	Content: DropdownContent,
	Item: DropdownItem,
	Label: DropdownLabel,
	Separator: DropdownSeparator,
};
