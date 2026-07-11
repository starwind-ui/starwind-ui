import HoverCard from "./HoverCard";
import HoverCardContent from "./HoverCardContent";
import HoverCardTrigger from "./HoverCardTrigger";
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
