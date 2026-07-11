import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import { IconCheck as Check } from "@tabler/icons-react";
import type * as React from "react";
import { contextMenuCheckboxItem, contextMenuCheckboxItemIndicator } from "./variants";

export type ContextMenuCheckboxItemProps = Omit<
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

function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps) {
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
    <ContextMenuPrimitive.CheckboxItem
      className={contextMenuCheckboxItem({ inset, disabled, class: className })}
      checked={checked}
      defaultChecked={defaultChecked}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...rest}
      data-slot="context-menu-checkbox-item"
    >
      {showIndicator && (
        <ContextMenuPrimitive.CheckboxItemIndicator
          className={contextMenuCheckboxItemIndicator({ class: indicatorClassName })}
          data-slot="context-menu-checkbox-item-indicator"
        >
          {indicator ?? <Check className="size-4" />}
        </ContextMenuPrimitive.CheckboxItemIndicator>
      )}

      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

export default ContextMenuCheckboxItem;
