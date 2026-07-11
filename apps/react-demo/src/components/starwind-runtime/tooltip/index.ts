import Tooltip from "./Tooltip";
import TooltipContent from "./TooltipContent";
import TooltipTrigger from "./TooltipTrigger";
import { tooltip, tooltipCaret, tooltipContent } from "./variants";

const TooltipVariants = {
  tooltip,
  tooltipCaret,
  tooltipContent,
};

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };

export default {
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
