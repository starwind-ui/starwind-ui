import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuCheckboxItemIndicator } from "./variants";

export type ContextMenuCheckboxItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function ContextMenuCheckboxItemIndicator(props: ContextMenuCheckboxItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.CheckboxItemIndicator
      className={contextMenuCheckboxItemIndicator({ class: className })}
      {...rest}
      data-slot="context-menu-checkbox-item-indicator"
    >
      {children}
    </ContextMenuPrimitive.CheckboxItemIndicator>
  );
}

export default ContextMenuCheckboxItemIndicator;
