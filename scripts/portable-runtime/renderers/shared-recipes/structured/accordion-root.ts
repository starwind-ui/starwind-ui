import { type AccordionPlan, accordionFrame, accordionPlan } from "./accordion.js";
import type { Target } from "./operations.js";
import { printRootFrame } from "./root-frame.js";
export function renderAccordionRoot(target: Target, plan: AccordionPlan = accordionPlan): string {
  return printRootFrame(target, accordionFrame, plan).replace(/^[\t ]+$/gm, "");
}
