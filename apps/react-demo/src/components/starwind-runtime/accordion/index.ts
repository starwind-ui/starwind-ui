"use client";

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

const AccordionParts = {
  Root: Accordion,
  Content: AccordionContent,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionVariants };

export default AccordionParts;
