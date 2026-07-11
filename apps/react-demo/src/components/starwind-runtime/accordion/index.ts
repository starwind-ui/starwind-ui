import Accordion from "./Accordion";
import AccordionContent from "./AccordionContent";
import AccordionItem from "./AccordionItem";
import AccordionTrigger from "./AccordionTrigger";
import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants";

const AccordionVariants = {
  accordion,
  accordionContent,
  accordionItem,
  accordionTrigger,
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };

export default {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};
