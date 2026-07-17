import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  IconChevronRight,
} from "../kit";

export function AccordionDemo() {
  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">Single Accordion</h2>
        <Accordion defaultValue="shipping">
          <AccordionItem value="shipping">
            <AccordionTrigger>Shipping options</AccordionTrigger>
            <AccordionContent>
              Ships with the same runtime behavior as the Astro prototype, initialized through a
              React primitive root.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>Returns</AccordionTrigger>
            <AccordionContent>
              Trigger, panel, keyboard navigation, and data-state updates all come from the runtime.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="disabled" disabled>
            <AccordionTrigger>Disabled item</AccordionTrigger>
            <AccordionContent>This item should not open.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">Multiple Accordion</h2>
        <Accordion type="multiple" defaultValue={["performance", "adapters"]}>
          <AccordionItem value="performance">
            <AccordionTrigger>Performance</AccordionTrigger>
            <AccordionContent>
              State transitions stay small and testable while DOM work is handled by the controller.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="adapters">
            <AccordionTrigger>Adapters</AccordionTrigger>
            <AccordionContent>
              The styled React adapter can diverge ergonomically from the primitive anatomy.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="raw-html">
            <AccordionTrigger>Raw HTML</AccordionTrigger>
            <AccordionContent>
              Raw HTML users can initialize matching data attributes with initStarwind().
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="md:col-span-2">
        <h2 className="font-heading mb-4 text-xl font-semibold">Required-open Accordion</h2>
        <Accordion
          id="react-runtime-required-open-accordion"
          defaultValue="runtime"
          collapsible={false}
          className="grid gap-3"
        >
          <AccordionItem className="bg-muted/30 rounded-md border px-4" value="runtime">
            <AccordionTrigger
              className="py-3"
              icon={
                <IconChevronRight className="size-5 shrink-0 transition-transform duration-200" />
              }
            >
              Runtime behavior
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              The custom item keeps runtime state, keyboard controls, and generated panel animation.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="bg-background rounded-md border px-4 shadow-xs" value="styling">
            <AccordionTrigger
              className="py-3"
              icon={
                <IconChevronRight className="size-5 shrink-0 transition-transform duration-200" />
              }
            >
              Custom styling
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Item, trigger, content, and icon classes can be customized without changing the
              runtime.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
