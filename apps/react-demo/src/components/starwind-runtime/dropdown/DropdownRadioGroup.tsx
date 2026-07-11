import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownRadioGroup } from "./variants";

export type DropdownRadioGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (
    value: string,
    details: import("@starwind-ui/react/menu").MenuValueChangeDetails,
  ) => void;
};

function DropdownRadioGroup(props: DropdownRadioGroupProps) {
  const { className, value, defaultValue, onValueChange, children, ...rest } = props;

  return (
    <MenuPrimitive.RadioGroup
      className={dropdownRadioGroup({ class: className })}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      {...rest}
      data-slot="dropdown-radio-group"
    >
      {children}
    </MenuPrimitive.RadioGroup>
  );
}

export default DropdownRadioGroup;
