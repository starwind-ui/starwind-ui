import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdown } from "./variants";

export type DropdownProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/menu").MenuOpenChangeDetails,
  ) => void;
  onCloseComplete?: (details: import("@starwind-ui/react/menu").MenuCloseCompleteDetails) => void;
};

function Dropdown(props: DropdownProps) {
  const {
    defaultOpen = false,
    open,
    disabled = false,
    modal = false,
    openOnHover = false,
    closeDelay = 200,
    onOpenChange,
    onCloseComplete,
    className,
    children,
    ...rest
  } = props;

  return (
    <MenuPrimitive.Root
      className={dropdown({ class: className })}
      defaultOpen={defaultOpen}
      open={open}
      disabled={disabled}
      modal={modal}
      openOnHover={openOnHover}
      closeDelay={closeDelay}
      onOpenChange={onOpenChange}
      onCloseComplete={onCloseComplete}
      {...rest}
      data-slot="dropdown"
    >
      {children}
    </MenuPrimitive.Root>
  );
}

export default Dropdown;
