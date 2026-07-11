import MenuPrimitive from "@starwind-ui/react/menu";
import { IconCheck as Check } from "@tabler/icons-react";
import type * as React from "react";
import { dropdownCheckboxItem, dropdownCheckboxItemIndicator } from "./variants";

export type DropdownCheckboxItemProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "aria-checked" | "role"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  indicator?: React.ReactNode;
};

function DropdownCheckboxItem(props: DropdownCheckboxItemProps) {
  const {
    className,
    checked,
    defaultChecked = false,
    closeOnClick = false,
    inset = false,
    disabled = false,
    indicatorClass: indicatorClassName,
    showIndicator = true,
    children,
    indicator,
    ...rest
  } = props;

  return (
    <MenuPrimitive.CheckboxItem
      className={dropdownCheckboxItem({ inset, disabled, class: className })}
      checked={checked}
      defaultChecked={defaultChecked}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...rest}
      data-slot="dropdown-checkbox-item"
    >
      {showIndicator && (
        <MenuPrimitive.CheckboxItemIndicator
          className={dropdownCheckboxItemIndicator({ class: indicatorClassName })}
          data-slot="dropdown-checkbox-item-indicator"
        >
          {indicator ?? <Check className="size-4" />}
        </MenuPrimitive.CheckboxItemIndicator>
      )}

      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export default DropdownCheckboxItem;
