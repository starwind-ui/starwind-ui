import Collapsible from "./Collapsible.svelte";
import CollapsibleContent from "./CollapsibleContent.svelte";
import CollapsibleTrigger from "./CollapsibleTrigger.svelte";
import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants.js";

export type { CollapsibleProps } from "./Collapsible.svelte";
export type { CollapsibleContentProps } from "./CollapsibleContent.svelte";
export type {
  ButtonChildPayload,
  ButtonChildProps,
  CollapsibleTriggerProps,
} from "./CollapsibleTrigger.svelte";

const CollapsibleVariants = { collapsible, collapsibleContent, collapsibleTrigger };
const CollapsibleParts = {
  Root: Collapsible,
  Content: CollapsibleContent,
  Trigger: CollapsibleTrigger,
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleVariants };
export default CollapsibleParts;
