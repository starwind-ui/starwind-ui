import Accordion from "./Accordion.svelte";
import AccordionItem from "./AccordionItem.svelte";
import AccordionTrigger from "./AccordionTrigger.svelte";
import AccordionContent from "./AccordionContent.svelte";
import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";
export type { AccordionProps } from "./Accordion.svelte";
export type { AccordionItemProps } from "./AccordionItem.svelte";
export type { AccordionTriggerProps } from "./AccordionTrigger.svelte";
export type { AccordionContentProps } from "./AccordionContent.svelte";
const AccordionVariants = { accordion, accordionContent, accordionItem, accordionTrigger };
const AccordionParts = {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };
export default AccordionParts;
