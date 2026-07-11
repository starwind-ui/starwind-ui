import MenuPrimitive from "@starwind-ui/react/menu";
import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import type * as React from "react";
import { dropdownItem } from "./variants";

export type DropdownSubTriggerProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
  disabled?: boolean;
};

function DropdownSubTrigger(props: DropdownSubTriggerProps) {
  const { className, inset = false, disabled = false, children, ...rest } = props;

  const subTriggerClassName = className;

  return (
    <MenuPrimitive.SubmenuTrigger
      className={dropdownItem({ inset, disabled, class: subTriggerClassName })}
      disabled={disabled}
      {...rest}
      data-slot="dropdown-sub-trigger"
    >
      {children}

      <ChevronRight className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

export default DropdownSubTrigger;
