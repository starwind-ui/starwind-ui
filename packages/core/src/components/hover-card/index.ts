import HoverCard, { hoverCard } from "./HoverCard.astro";
import HoverCardContent, { hoverCardContent } from "./HoverCardContent.astro";
import HoverCardTrigger, { hoverCardTrigger } from "./HoverCardTrigger.astro";

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
