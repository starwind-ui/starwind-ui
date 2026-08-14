import Tooltip from "./Tooltip.vue";
import TooltipContent from "./TooltipContent.vue";
import TooltipTrigger from "./TooltipTrigger.vue";
import { tooltip, tooltipCaret, tooltipContent, tooltipPositioner } from "./variants";

export type { TooltipProps } from "./Tooltip.vue";
export type { TooltipContentProps } from "./TooltipContent.vue";
export type { TooltipTriggerProps } from "./TooltipTrigger.vue";

const TooltipVariants = { tooltip, tooltipCaret, tooltipContent, tooltipPositioner };

const TooltipParts = { Root: Tooltip, Trigger: TooltipTrigger, Content: TooltipContent };

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };

export default TooltipParts;
