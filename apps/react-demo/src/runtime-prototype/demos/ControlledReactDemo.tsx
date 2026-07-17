import { useRuntimePrototypeContext } from "../context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../kit";

export function ControlledReactDemo() {
  const {
    controlledCollapsibleOpen,
    setControlledCollapsibleOpen,
    controlledCollapsibleChanges,
    setControlledCollapsibleChanges,
    controlledAccordionValue,
    setControlledAccordionValue,
    controlledAccordionChanges,
    setControlledAccordionChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Controlled React</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Collapsible
          open={controlledCollapsibleOpen}
          onOpenChange={(open) => {
            setControlledCollapsibleOpen(open);
            setControlledCollapsibleChanges((count) => count + 1);
          }}
          className="rounded-md border p-4"
        >
          <CollapsibleTrigger className={button({ variant: "outline", size: "sm" })}>
            Controlled collapsible trigger
          </CollapsibleTrigger>
          <CollapsibleContent className="text-muted-foreground mt-3 text-sm">
            Controlled collapsible content
          </CollapsibleContent>
        </Collapsible>
        <div className="space-y-2">
          <Button variant="secondary" size="sm" onClick={() => setControlledCollapsibleOpen(true)}>
            Parent opens controlled collapsible
          </Button>
          <p data-runtime-controlled-collapsible-count>
            Collapsible changes: {controlledCollapsibleChanges}
          </p>
        </div>
      </div>

      <Accordion
        value={controlledAccordionValue}
        onValueChange={(details) => {
          setControlledAccordionValue(details.value);
          setControlledAccordionChanges((count) => count + 1);
        }}
      >
        <AccordionItem value="controlled-shipping">
          <AccordionTrigger>Controlled shipping</AccordionTrigger>
          <AccordionContent>Controlled shipping content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="controlled-billing">
          <AccordionTrigger>Controlled billing</AccordionTrigger>
          <AccordionContent>Controlled billing content</AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setControlledAccordionValue("controlled-billing")}
        >
          Parent sets controlled accordion
        </Button>
        <p data-runtime-controlled-accordion-count>
          Accordion changes: {controlledAccordionChanges}
        </p>
      </div>
    </section>
  );
}
