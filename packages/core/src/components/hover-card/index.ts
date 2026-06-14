import HoverCard from "./HoverCard.astro";
import HoverCardContent from "./HoverCardContent.astro";
import HoverCardTrigger from "./HoverCardTrigger.astro";
import { hoverCard, hoverCardContent, hoverCardTrigger } from "./variants";

const HoverCardVariants = {
  hoverCard,
  hoverCardContent,
  hoverCardTrigger,
};

export { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardVariants };

export default {
  Root: HoverCard,
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
};
