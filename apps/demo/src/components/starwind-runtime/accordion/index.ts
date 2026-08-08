import Accordion from "./Accordion.astro";
import AccordionContent from "./AccordionContent.astro";
import AccordionItem from "./AccordionItem.astro";
import AccordionTrigger from "./AccordionTrigger.astro";
import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants";

const AccordionVariants = {
  accordion,
  accordionContent,
  accordionItem,
  accordionTrigger,
};

const AccordionParts = {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };

export default AccordionParts;
