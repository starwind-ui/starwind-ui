import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import { popover } from "./variants";

export type PopoverProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/popover").PopoverOpenChangeDetails,
  ) => void;
  onCloseComplete?: (
    details: import("@starwind-ui/react/popover").PopoverCloseCompleteDetails,
  ) => void;
};

function Popover(props: PopoverProps) {
  const {
    defaultOpen = false,
    open,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
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
    <PopoverPrimitive.Root
      className={popover({ class: className })}
      defaultOpen={defaultOpen}
      open={open}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      modal={modal}
      openOnHover={openOnHover}
      closeDelay={closeDelay}
      onOpenChange={onOpenChange}
      onCloseComplete={onCloseComplete}
      {...rest}
      data-slot="popover"
    >
      {children}
    </PopoverPrimitive.Root>
  );
}

export default Popover;
