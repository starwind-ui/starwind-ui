import Tooltip from "./Tooltip.svelte";
import TooltipContent from "./TooltipContent.svelte";
import TooltipTrigger from "./TooltipTrigger.svelte";
import { tooltip, tooltipCaret, tooltipContent, tooltipPositioner } from "./variants.js";

export type { TooltipProps } from "./Tooltip.svelte";
export type { TooltipContentProps } from "./TooltipContent.svelte";
export type { TooltipTriggerProps } from "./TooltipTrigger.svelte";

const TooltipVariants = { tooltip, tooltipCaret, tooltipContent, tooltipPositioner };
const TooltipParts = { Root: Tooltip, Trigger: TooltipTrigger, Content: TooltipContent };

export { Tooltip, TooltipContent, TooltipTrigger, TooltipVariants };
export default TooltipParts;
