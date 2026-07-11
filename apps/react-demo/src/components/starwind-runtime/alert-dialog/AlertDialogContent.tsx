import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";
import { alertDialogBackdrop, alertDialogContent } from "./variants";

export type AlertDialogContentProps = React.ComponentPropsWithoutRef<"dialog"> & {
  backdrop?: React.ReactNode;
};

function AlertDialogContent(props: AlertDialogContentProps) {
  const { className, children, backdrop, ...rest } = props;

  return (
    <>
      {backdrop ?? (
        <AlertDialogPrimitive.Backdrop
          className={alertDialogBackdrop()}
          data-state="closed"
          hidden
          data-slot="alert-dialog-backdrop"
        />
      )}

      <AlertDialogPrimitive.Popup
        className={alertDialogContent({ class: className })}
        role="alertdialog"
        data-state="closed"
        {...rest}
        data-slot="alert-dialog-content"
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </>
  );
}

export default AlertDialogContent;
