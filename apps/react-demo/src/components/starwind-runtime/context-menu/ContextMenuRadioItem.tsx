import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuRadioItem, contextMenuRadioItemIndicator } from "./variants";

export type ContextMenuRadioItemProps = Omit<
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

function ContextMenuRadioItem(props: ContextMenuRadioItemProps) {
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
    <ContextMenuPrimitive.RadioItem
      className={contextMenuRadioItem({ inset, disabled, class: className })}
      value={value}
      checked={checked}
      defaultChecked={defaultChecked}
      closeOnClick={closeOnClick}
      disabled={disabled}
      {...rest}
      data-slot="context-menu-radio-item"
    >
      {showIndicator && (
        <ContextMenuPrimitive.RadioItemIndicator
          className={contextMenuRadioItemIndicator({ class: indicatorClassName })}
          data-slot="context-menu-radio-item-indicator"
        >
          {indicator ?? <span className="size-2 rounded-full bg-current" />}
        </ContextMenuPrimitive.RadioItemIndicator>
      )}

      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

export default ContextMenuRadioItem;
