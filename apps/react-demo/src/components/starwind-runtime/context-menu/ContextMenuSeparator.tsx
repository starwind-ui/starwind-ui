import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuSeparator } from "./variants";

export type ContextMenuSeparatorProps = React.ComponentPropsWithoutRef<"div">;

function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  const { className, ...rest } = props;

  return (
    <ContextMenuPrimitive.Separator
      className={contextMenuSeparator({ class: className })}
      {...rest}
      data-slot="context-menu-separator"
    />
  );
}

export default ContextMenuSeparator;
