import Select from "./Select.astro";
import SelectContent from "./SelectContent.astro";
import SelectGroup from "./SelectGroup.astro";
import SelectItem from "./SelectItem.astro";
import SelectLabel from "./SelectLabel.astro";
import SelectSeparator from "./SelectSeparator.astro";
import SelectTrigger from "./SelectTrigger.astro";
import SelectValue from "./SelectValue.astro";

export {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
	SelectSeparator,
};

export default {
	Root: Select,
	Trigger: SelectTrigger,
	Value: SelectValue,
	Content: SelectContent,
	Group: SelectGroup,
	Label: SelectLabel,
	Item: SelectItem,
	Separator: SelectSeparator,
};
