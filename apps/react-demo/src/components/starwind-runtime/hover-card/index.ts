"use client";

import HoverCard from "./HoverCard";
import HoverCardContent from "./HoverCardContent";
import HoverCardTrigger from "./HoverCardTrigger";
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
