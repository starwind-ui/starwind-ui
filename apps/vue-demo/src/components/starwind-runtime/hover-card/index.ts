import HoverCard from "./HoverCard.vue";
import HoverCardContent from "./HoverCardContent.vue";
import HoverCardTrigger from "./HoverCardTrigger.vue";
import { hoverCard, hoverCardContent, hoverCardTrigger } from "./variants";

export type { HoverCardProps } from "./HoverCard.vue";
export type { HoverCardContentProps } from "./HoverCardContent.vue";
export type { HoverCardTriggerProps } from "./HoverCardTrigger.vue";

const HoverCardVariants = { hoverCard, hoverCardContent, hoverCardTrigger };

export { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardVariants };

export default { Root: HoverCard, Trigger: HoverCardTrigger, Content: HoverCardContent };
