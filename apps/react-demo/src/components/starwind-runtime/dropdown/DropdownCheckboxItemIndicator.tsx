import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownCheckboxItemIndicator } from "./variants";

export type DropdownCheckboxItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function DropdownCheckboxItemIndicator(props: DropdownCheckboxItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <MenuPrimitive.CheckboxItemIndicator
      className={dropdownCheckboxItemIndicator({ class: className })}
      {...rest}
      data-slot="dropdown-checkbox-item-indicator"
    >
      {children}
    </MenuPrimitive.CheckboxItemIndicator>
  );
}

export default DropdownCheckboxItemIndicator;
