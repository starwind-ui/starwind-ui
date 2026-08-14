"use client";

import Tooltip from "./Tooltip";
import TooltipContent from "./TooltipContent";
import TooltipTrigger from "./TooltipTrigger";
import { tooltip, tooltipCaret, tooltipContent, tooltipPositioner } from "./variants";

const TooltipVariants = {
  tooltip,
  tooltipCaret,
  tooltipContent,
  tooltipPositioner,
};

const TooltipParts = {
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };

export default TooltipParts;
