import Tooltip from "./Tooltip.astro";
import TooltipContent from "./TooltipContent.astro";
import TooltipTrigger from "./TooltipTrigger.astro";
import { tooltip, tooltipContent } from "./variants";

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
