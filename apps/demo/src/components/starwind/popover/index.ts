import Popover from "@/components/starwind/popover/Popover.astro";
import PopoverContent from "@/components/starwind/popover/PopoverContent.astro";
import PopoverTrigger from "@/components/starwind/popover/PopoverTrigger.astro";

export {
    Popover,
    PopoverContent,
    PopoverTrigger
}

export default {
    Root: Popover,
    Content: PopoverContent,
    Trigger: PopoverTrigger
}