import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";

export type SheetProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  onCloseComplete?: (
    details: import("@starwind-ui/react/drawer").DrawerCloseCompleteDetails,
  ) => void;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/drawer").DrawerOpenChangeDetails,
  ) => void;
};

function Sheet(props: SheetProps) {
  const {
    defaultOpen = false,
    open,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    modal = true,
    onCloseComplete,
    onOpenChange,
    className,
    children,
    ...rest
  } = props;

  const rootClassName = className;

  return (
    <SheetPrimitive.Root
      className={rootClassName}
      defaultOpen={defaultOpen}
      open={open}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      modal={modal}
      onCloseComplete={onCloseComplete}
      onOpenChange={onOpenChange}
      {...rest}
      data-slot="sheet"
    >
      {children}
    </SheetPrimitive.Root>
  );
}

export default Sheet;
