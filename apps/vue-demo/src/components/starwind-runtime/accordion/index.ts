import Accordion from "./Accordion.vue";
import AccordionContent from "./AccordionContent.vue";
import AccordionItem from "./AccordionItem.vue";
import AccordionTrigger from "./AccordionTrigger.vue";
import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants";

export type { AccordionProps } from "./Accordion.vue";
export type { AccordionContentProps } from "./AccordionContent.vue";
export type { AccordionItemProps } from "./AccordionItem.vue";
export type { AccordionTriggerProps } from "./AccordionTrigger.vue";

const AccordionVariants = { accordion, accordionContent, accordionItem, accordionTrigger };

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };

export default {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};
