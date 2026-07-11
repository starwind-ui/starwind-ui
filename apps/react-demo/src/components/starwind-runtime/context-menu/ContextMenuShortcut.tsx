import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuShortcut } from "./variants";

export type ContextMenuShortcutProps = React.ComponentPropsWithoutRef<"span">;

function ContextMenuShortcut(props: ContextMenuShortcutProps) {
  const { className, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Shortcut
      className={contextMenuShortcut({ class: className })}
      {...rest}
      data-slot="context-menu-shortcut"
    >
      {children}
    </ContextMenuPrimitive.Shortcut>
  );
}

export default ContextMenuShortcut;
