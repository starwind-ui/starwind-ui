import Collapsible from "./Collapsible.vue";
import CollapsibleContent from "./CollapsibleContent.vue";
import CollapsibleTrigger from "./CollapsibleTrigger.vue";
import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants";

export type { CollapsibleProps } from "./Collapsible.vue";
export type { CollapsibleContentProps } from "./CollapsibleContent.vue";
export type { CollapsibleTriggerProps } from "./CollapsibleTrigger.vue";

const CollapsibleVariants = { collapsible, collapsibleContent, collapsibleTrigger };

const CollapsibleParts = {
  Root: Collapsible,
  Content: CollapsibleContent,
  Trigger: CollapsibleTrigger,
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleVariants };

export default CollapsibleParts;
