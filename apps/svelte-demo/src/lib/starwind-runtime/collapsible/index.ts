import Collapsible from "./Collapsible.svelte";
import CollapsibleTrigger from "./CollapsibleTrigger.svelte";
import CollapsibleContent from "./CollapsibleContent.svelte";
import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants.js";
export type { CollapsibleProps } from "./Collapsible.svelte";
export type {
  CollapsibleTriggerProps,
  ButtonChildProps,
  ButtonChildPayload,
} from "./CollapsibleTrigger.svelte";
export type { CollapsibleContentProps } from "./CollapsibleContent.svelte";
const CollapsibleVariants = { collapsible, collapsibleContent, collapsibleTrigger };
const CollapsibleParts = {
  Root: Collapsible,
  Content: CollapsibleContent,
  Trigger: CollapsibleTrigger,
};
export { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleVariants };
export default CollapsibleParts;
