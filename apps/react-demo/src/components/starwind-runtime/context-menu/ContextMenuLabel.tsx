import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuLabel } from "./variants";

export type ContextMenuLabelProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
};

function ContextMenuLabel(props: ContextMenuLabelProps) {
  const { className, inset = false, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Label
      className={contextMenuLabel({ inset, class: className })}
      {...rest}
      data-slot="context-menu-label"
    >
      {children}
    </ContextMenuPrimitive.Label>
  );
}

export default ContextMenuLabel;
