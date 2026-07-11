import type * as React from "react";
import { alertDialogHeader } from "./variants";

export type AlertDialogHeaderProps = React.ComponentPropsWithoutRef<"div">;

function AlertDialogHeader(props: AlertDialogHeaderProps) {
  const { className, children, ...rest } = props;

  return (
    <div
      className={alertDialogHeader({ class: className })}
      {...rest}
      data-slot="alert-dialog-header"
    >
      {children}
    </div>
  );
}

export default AlertDialogHeader;
