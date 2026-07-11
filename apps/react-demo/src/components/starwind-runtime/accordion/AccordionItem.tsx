import AccordionPrimitive from "@starwind-ui/react/accordion";
import type * as React from "react";
import { accordionItem } from "./variants";

export type AccordionItemProps = React.ComponentPropsWithoutRef<"div"> & {
  value: string;
  disabled?: boolean;
};

function AccordionItem(props: AccordionItemProps) {
  const { value, disabled = false, className, children, ...rest } = props;

  return (
    <AccordionPrimitive.Item
      className={accordionItem({ class: className })}
      value={value}
      disabled={disabled}
      {...rest}
      data-slot="accordion-item"
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

export default AccordionItem;
