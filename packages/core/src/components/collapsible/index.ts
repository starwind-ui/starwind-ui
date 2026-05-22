import Collapsible from "./Collapsible.astro";
import CollapsibleContent from "./CollapsibleContent.astro";
import CollapsibleTrigger from "./CollapsibleTrigger.astro";
import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants";
const CollapsibleVariants = { collapsible, collapsibleContent, collapsibleTrigger };

export { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleVariants };

export default {
  Root: Collapsible,
  Content: CollapsibleContent,
  Trigger: CollapsibleTrigger,
};
