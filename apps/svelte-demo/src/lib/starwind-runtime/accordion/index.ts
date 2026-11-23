import Accordion from "./Accordion.svelte";
import AccordionContent from "./AccordionContent.svelte";
import AccordionItem from "./AccordionItem.svelte";
import AccordionTrigger from "./AccordionTrigger.svelte";
import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";

export type { AccordionProps } from "./Accordion.svelte";
export type { AccordionContentProps } from "./AccordionContent.svelte";
export type { AccordionItemProps } from "./AccordionItem.svelte";
export type { AccordionTriggerProps } from "./AccordionTrigger.svelte";

const AccordionVariants = { accordion, accordionContent, accordionItem, accordionTrigger };
const AccordionParts = {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };
export default AccordionParts;
