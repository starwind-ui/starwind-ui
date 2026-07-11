import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownTrigger } from "./variants";

export type DropdownTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  ref?: React.Ref<HTMLElement>;
};

function DropdownTrigger(props: DropdownTriggerProps) {
  const { asChild = false, ref, className, children, ...rest } = props;

  const triggerBaseClassName = dropdownTrigger({ class: className });
  const triggerClassName = asChild ? className : triggerBaseClassName;

  return (
    <MenuPrimitive.Trigger
      className={triggerClassName}
      asChild={asChild}
      ref={ref}
      {...rest}
      data-slot="dropdown-trigger"
    >
      {children}
    </MenuPrimitive.Trigger>
  );
}

export default DropdownTrigger;
