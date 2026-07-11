import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";
import { alertDialogTitle } from "./variants";

export type AlertDialogTitleProps = React.ComponentPropsWithoutRef<"h2">;

function AlertDialogTitle(props: AlertDialogTitleProps) {
  const { className, children, ...rest } = props;

  return (
    <AlertDialogPrimitive.Title
      className={alertDialogTitle({ class: className })}
      {...rest}
      data-slot="alert-dialog-title"
    >
      {children}
    </AlertDialogPrimitive.Title>
  );
}

export default AlertDialogTitle;
