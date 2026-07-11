import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";

export type ContextMenuGroupProps = React.ComponentPropsWithoutRef<"div">;

function ContextMenuGroup(props: ContextMenuGroupProps) {
  const { className, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Group className={className} {...rest} data-slot="context-menu-group">
      {children}
    </ContextMenuPrimitive.Group>
  );
}

export default ContextMenuGroup;
