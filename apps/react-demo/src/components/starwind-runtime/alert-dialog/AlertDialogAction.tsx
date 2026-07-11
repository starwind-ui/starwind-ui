import type * as React from "react";
import { Button } from "../button";
import { alertDialogAction, alertDialogActionAsChild } from "./variants";

export type AlertDialogActionProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
};

function AlertDialogAction(props: AlertDialogActionProps) {
  const { asChild = false, variant = "default", size = "md", className, children, ...rest } = props;

  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={alertDialogActionAsChild({ variant, size, class: className })}
        data-as-child
        {...asChildRest}
        data-slot="alert-dialog-action"
        data-sw-alert-dialog-close
      >
        {children}
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={alertDialogAction({ class: className })}
      {...rest}
      data-slot="alert-dialog-action"
      data-sw-alert-dialog-close
    >
      {children}
    </Button>
  );
}

export default AlertDialogAction;
