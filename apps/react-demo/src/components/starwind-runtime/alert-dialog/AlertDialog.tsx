import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";

export type AlertDialogProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  onCloseComplete?: (
    details: import("@starwind-ui/react/alert-dialog").AlertDialogCloseCompleteDetails,
  ) => void;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/alert-dialog").AlertDialogOpenChangeDetails,
  ) => void;
};

function AlertDialog(props: AlertDialogProps) {
  const {
    defaultOpen = false,
    open,
    closeOnEscape = true,
    closeOnOutsideInteract = false,
    modal = true,
    onCloseComplete,
    onOpenChange,
    className,
    children,
    ...rest
  } = props;

  const rootClassName = className;

  return (
    <AlertDialogPrimitive.Root
      className={rootClassName}
      defaultOpen={defaultOpen}
      open={open}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      modal={modal}
      onCloseComplete={onCloseComplete}
      onOpenChange={onOpenChange}
      {...rest}
      data-slot="alert-dialog"
    >
      {children}
    </AlertDialogPrimitive.Root>
  );
}

export default AlertDialog;
