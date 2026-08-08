import Tooltip from "./Tooltip.astro";
import TooltipContent from "./TooltipContent.astro";
import TooltipTrigger from "./TooltipTrigger.astro";
import { tooltip, tooltipCaret, tooltipContent } from "./variants";

const TooltipVariants = {
  tooltip,
  tooltipCaret,
  tooltipContent,
};

const TooltipParts = {
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };

export default TooltipParts;
