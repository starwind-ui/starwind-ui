import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownItem } from "./variants";

export type DropdownItemProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
  disabled?: boolean;
};

function DropdownItem(props: DropdownItemProps) {
  const { className, inset = false, disabled = false, children, ...rest } = props;

  return (
    <MenuPrimitive.Item
      className={dropdownItem({ inset, disabled, class: className })}
      disabled={disabled}
      {...rest}
      data-slot="dropdown-item"
    >
      {children}
    </MenuPrimitive.Item>
  );
}

export default DropdownItem;
