import type * as React from "react";
import { Button } from "../button";
import { alertDialogCancel, alertDialogCancelAsChild } from "./variants";

export type AlertDialogCancelProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
};

function AlertDialogCancel(props: AlertDialogCancelProps) {
  const { asChild = false, variant = "outline", size = "md", className, children, ...rest } = props;

  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={alertDialogCancelAsChild({ variant, size, class: className })}
        data-as-child
        {...asChildRest}
        data-slot="alert-dialog-cancel"
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
      className={alertDialogCancel({ class: className })}
      {...rest}
      data-slot="alert-dialog-cancel"
      data-sw-alert-dialog-close
    >
      {children}
    </Button>
  );
}

export default AlertDialogCancel;
