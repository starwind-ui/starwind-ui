import HoverCard from "./HoverCard.svelte";
import HoverCardContent from "./HoverCardContent.svelte";
import HoverCardTrigger from "./HoverCardTrigger.svelte";
import { hoverCard, hoverCardContent, hoverCardPositioner, hoverCardTrigger } from "./variants.js";

export type { HoverCardProps } from "./HoverCard.svelte";
export type { HoverCardContentProps } from "./HoverCardContent.svelte";
export type {
  AnchorChildPayload,
  AnchorChildProps,
  HoverCardTriggerProps,
} from "./HoverCardTrigger.svelte";

const HoverCardVariants = { hoverCard, hoverCardContent, hoverCardPositioner, hoverCardTrigger };
const HoverCardParts = { Root: HoverCard, Trigger: HoverCardTrigger, Content: HoverCardContent };

export { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardVariants };
export default HoverCardParts;
