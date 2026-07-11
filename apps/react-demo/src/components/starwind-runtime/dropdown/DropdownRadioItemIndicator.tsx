import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownRadioItemIndicator } from "./variants";

export type DropdownRadioItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function DropdownRadioItemIndicator(props: DropdownRadioItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <MenuPrimitive.RadioItemIndicator
      className={dropdownRadioItemIndicator({ class: className })}
      {...rest}
      data-slot="dropdown-radio-item-indicator"
    >
      {children}
    </MenuPrimitive.RadioItemIndicator>
  );
}

export default DropdownRadioItemIndicator;
