import Tooltip, { tooltip } from "./Tooltip.astro";
import TooltipContent, { tooltipContent } from "./TooltipContent.astro";
import TooltipTrigger from "./TooltipTrigger.astro";

const TooltipVariants = {
  tooltip,
  tooltipContent,
};

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };

export default {
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
