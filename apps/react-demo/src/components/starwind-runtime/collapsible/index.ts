"use client";

import Collapsible from "./Collapsible";
import CollapsibleContent from "./CollapsibleContent";
import CollapsibleTrigger from "./CollapsibleTrigger";
import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants";

const CollapsibleVariants = {
  collapsible,
  collapsibleContent,
  collapsibleTrigger,
};

const CollapsibleParts = {
  Root: Collapsible,
  Content: CollapsibleContent,
  Trigger: CollapsibleTrigger,
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleVariants };

export default CollapsibleParts;
