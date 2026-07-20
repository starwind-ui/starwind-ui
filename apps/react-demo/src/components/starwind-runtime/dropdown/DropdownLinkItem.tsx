import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownItem } from "./variants";

export type DropdownLinkItemProps = React.ComponentPropsWithoutRef<"a"> & {
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
};

function DropdownLinkItem(props: DropdownLinkItemProps) {
  const {
    className,
    closeOnClick = false,
    inset = false,
    disabled = false,
    children,
    ...rest
  } = props;

  return (
    <MenuPrimitive.LinkItem
      className={dropdownItem({ inset, disabled, class: className })}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...rest}
      data-slot="dropdown-link-item"
    >
      {children}
    </MenuPrimitive.LinkItem>
  );
}

export default DropdownLinkItem;
