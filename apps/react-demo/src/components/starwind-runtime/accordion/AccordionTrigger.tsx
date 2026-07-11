import AccordionPrimitive from "@starwind-ui/react/accordion";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import { accordionTrigger } from "./variants";

export type AccordionTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  icon?: React.ReactNode;
};

function AccordionTrigger(props: AccordionTriggerProps) {
  const { className, children, icon, ...rest } = props;

  return (
    <AccordionPrimitive.Trigger
      className={accordionTrigger({ class: className })}
      {...rest}
      data-slot="accordion-trigger"
    >
      {children}

      {icon ?? <ChevronDown className="size-5 shrink-0 transition-transform duration-200" />}
    </AccordionPrimitive.Trigger>
  );
}

export default AccordionTrigger;
