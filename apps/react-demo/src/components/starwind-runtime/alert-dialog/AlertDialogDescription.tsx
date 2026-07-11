import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";
import { alertDialogDescription } from "./variants";

export type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<"p">;

function AlertDialogDescription(props: AlertDialogDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <AlertDialogPrimitive.Description
      className={alertDialogDescription({ class: className })}
      {...rest}
      data-slot="alert-dialog-description"
    >
      {children}
    </AlertDialogPrimitive.Description>
  );
}

export default AlertDialogDescription;
