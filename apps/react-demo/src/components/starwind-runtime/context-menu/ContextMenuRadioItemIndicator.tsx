import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuRadioItemIndicator } from "./variants";

export type ContextMenuRadioItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function ContextMenuRadioItemIndicator(props: ContextMenuRadioItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.RadioItemIndicator
      className={contextMenuRadioItemIndicator({ class: className })}
      {...rest}
      data-slot="context-menu-radio-item-indicator"
    >
      {children}
    </ContextMenuPrimitive.RadioItemIndicator>
  );
}

export default ContextMenuRadioItemIndicator;
