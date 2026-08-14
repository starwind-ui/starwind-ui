import HoverCard from "./HoverCard.astro";
import HoverCardContent from "./HoverCardContent.astro";
import HoverCardTrigger from "./HoverCardTrigger.astro";
import { hoverCard, hoverCardContent, hoverCardPositioner, hoverCardTrigger } from "./variants";

const HoverCardVariants = {
  hoverCard,
  hoverCardContent,
  hoverCardPositioner,
  hoverCardTrigger,
};

const HoverCardParts = {
  Root: HoverCard,
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
};

export { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardVariants };

export default HoverCardParts;
