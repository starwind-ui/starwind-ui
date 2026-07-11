import type * as React from "react";
import { alertDialogFooter } from "./variants";

export type AlertDialogFooterProps = React.ComponentPropsWithoutRef<"div">;

function AlertDialogFooter(props: AlertDialogFooterProps) {
  const { className, children, ...rest } = props;

  return (
    <div
      className={alertDialogFooter({ class: className })}
      {...rest}
      data-slot="alert-dialog-footer"
    >
      {children}
    </div>
  );
}

export default AlertDialogFooter;
