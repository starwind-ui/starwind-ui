import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownRadioItem, dropdownRadioItemIndicator } from "./variants";

export type DropdownRadioItemProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "aria-checked" | "role"
> & {
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  indicator?: React.ReactNode;
};

function DropdownRadioItem(props: DropdownRadioItemProps) {
  const {
    className,
    value,
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
    <MenuPrimitive.RadioItem
      className={dropdownRadioItem({ inset, disabled, class: className })}
      value={value}
      checked={checked}
      defaultChecked={defaultChecked}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...rest}
      data-slot="dropdown-radio-item"
    >
      {showIndicator && (
        <MenuPrimitive.RadioItemIndicator
          className={dropdownRadioItemIndicator({ class: indicatorClassName })}
          data-slot="dropdown-radio-item-indicator"
        >
          {indicator ?? <span className="size-2 rounded-full bg-current" />}
        </MenuPrimitive.RadioItemIndicator>
      )}

      {children}
    </MenuPrimitive.RadioItem>
  );
}

export default DropdownRadioItem;
