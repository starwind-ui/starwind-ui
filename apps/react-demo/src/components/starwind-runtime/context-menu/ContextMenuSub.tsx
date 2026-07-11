import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";

export type ContextMenuSubProps = React.ComponentPropsWithoutRef<"div"> & {
  closeDelay?: number;
};

function ContextMenuSub(props: ContextMenuSubProps) {
  const { className, closeDelay = 200, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.SubmenuRoot
      className={["relative", className].filter(Boolean).join(" ")}
      closeDelay={closeDelay}
      {...rest}
      data-slot="context-menu-sub"
    >
      {children}
    </ContextMenuPrimitive.SubmenuRoot>
  );
}

export default ContextMenuSub;
