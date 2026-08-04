import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import { popoverTrigger } from "./variants";

export type PopoverTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function PopoverTrigger(props: PopoverTriggerProps) {
  const { asChild = false, className, children, ...rest } = props;

  const triggerBaseClassName = popoverTrigger({ class: className });
  const triggerClassName = asChild ? className : triggerBaseClassName;

  return (
    <PopoverPrimitive.Trigger
      className={triggerClassName}
      asChild={asChild}
      {...rest}
      data-slot="popover-trigger"
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

export default PopoverTrigger;
