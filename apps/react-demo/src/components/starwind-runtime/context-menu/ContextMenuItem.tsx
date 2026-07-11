import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuItem } from "./variants";

export type ContextMenuItemProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
  disabled?: boolean;
};

function ContextMenuItem(props: ContextMenuItemProps) {
  const { className, inset = false, disabled = false, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Item
      className={contextMenuItem({ inset, disabled, class: className })}
      disabled={disabled}
      {...rest}
      data-slot="context-menu-item"
    >
      {children}
    </ContextMenuPrimitive.Item>
  );
}

export default ContextMenuItem;
