import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenu } from "./variants";

export type ContextMenuProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  closeDelay?: number;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/context-menu").ContextMenuOpenChangeDetails,
  ) => void;
  onCloseComplete?: (
    details: import("@starwind-ui/react/context-menu").ContextMenuCloseCompleteDetails,
  ) => void;
};

function ContextMenu(props: ContextMenuProps) {
  const {
    defaultOpen = false,
    open,
    disabled = false,
    modal = true,
    closeDelay = 200,
    onOpenChange,
    onCloseComplete,
    className,
    children,
    ...rest
  } = props;

  return (
    <ContextMenuPrimitive.Root
      className={contextMenu({ class: className })}
      defaultOpen={defaultOpen}
      open={open}
      disabled={disabled}
      modal={modal}
      closeDelay={closeDelay}
      onOpenChange={onOpenChange}
      onCloseComplete={onCloseComplete}
      {...rest}
      data-slot="context-menu"
    >
      {children}
    </ContextMenuPrimitive.Root>
  );
}

export default ContextMenu;
