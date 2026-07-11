import AccordionPrimitive from "@starwind-ui/react/accordion";
import type * as React from "react";
import { accordionContent } from "./variants";

export type AccordionContentProps = React.ComponentPropsWithoutRef<"div">;

function AccordionContent(props: AccordionContentProps) {
  const { className, children, ...rest } = props;

  return (
    <AccordionPrimitive.Panel
      className={accordionContent({ class: className })}
      {...rest}
      data-slot="accordion-content"
    >
      <div className="pt-0 pb-4">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export default AccordionContent;
