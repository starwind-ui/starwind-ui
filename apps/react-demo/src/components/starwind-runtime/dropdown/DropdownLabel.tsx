import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownLabel } from "./variants";

export type DropdownLabelProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
};

function DropdownLabel(props: DropdownLabelProps) {
  const { className, inset = false, children, ...rest } = props;

  return (
    <MenuPrimitive.Label
      className={dropdownLabel({ inset, class: className })}
      {...rest}
      data-slot="dropdown-label"
    >
      {children}
    </MenuPrimitive.Label>
  );
}

export default DropdownLabel;
