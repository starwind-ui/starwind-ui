import HoverCard from "./HoverCard.svelte";
import HoverCardTrigger from "./HoverCardTrigger.svelte";
import HoverCardContent from "./HoverCardContent.svelte";
import { hoverCard, hoverCardContent, hoverCardPositioner, hoverCardTrigger } from "./variants.js";
export type { HoverCardProps } from "./HoverCard.svelte";
export type {
  HoverCardTriggerProps,
  AnchorChildProps,
  AnchorChildPayload,
} from "./HoverCardTrigger.svelte";
export type { HoverCardContentProps } from "./HoverCardContent.svelte";
const HoverCardVariants = { hoverCard, hoverCardContent, hoverCardPositioner, hoverCardTrigger };
const HoverCardParts = { Root: HoverCard, Trigger: HoverCardTrigger, Content: HoverCardContent };
export { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardVariants };
export default HoverCardParts;
