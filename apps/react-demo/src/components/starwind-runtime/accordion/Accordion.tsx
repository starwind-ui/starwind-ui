import AccordionPrimitive from "@starwind-ui/react/accordion";
import type * as React from "react";
import { accordion } from "./variants";

export type AccordionProps = React.ComponentPropsWithoutRef<"div"> & {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: import("@starwind-ui/react/accordion").AccordionValue;
  collapsible?: boolean;
  onValueChange?: (
    details: import("@starwind-ui/react/accordion").AccordionValueChangeDetails,
  ) => void;
};

function Accordion(props: AccordionProps) {
  const {
    type = "single",
    defaultValue,
    value,
    collapsible = false,
    onValueChange,
    className,
    children,
    ...rest
  } = props;

  return (
    <AccordionPrimitive.Root
      className={accordion({ class: className })}
      type={type}
      defaultValue={defaultValue}
      value={value}
      collapsible={collapsible}
      onValueChange={onValueChange}
      {...rest}
      data-slot="accordion"
    >
      {children}
    </AccordionPrimitive.Root>
  );
}

export default Accordion;
