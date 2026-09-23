"use client";

import { __useAlertDialogControl } from "@starwind-ui/react/alert-dialog";
import type * as React from "react";
import { Button } from "../button";
import { alertDialogCancel, alertDialogCancelAsChild } from "./variants";

export type AlertDialogCancelProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
};

function AlertDialogCancel(props: AlertDialogCancelProps) {
  const { asChild = false, variant = "outline", size = "md", className, children, ...rest } = props;

  const consumerRef = (props as { ref?: React.Ref<HTMLElement> }).ref;
  const { controlKey, setControlElement } = __useAlertDialogControl({
    asChild,
    children,
    forwardedRef: consumerRef,
  });
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={alertDialogCancelAsChild({ class: className, size, variant })}
        data-as-child
        {...asChildRest}
        data-slot="alert-dialog-cancel"
        data-sw-alert-dialog-close
        key={controlKey}
        ref={setControlElement}
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
      ref={setControlElement}
    >
      {children}
    </Button>
  );
}

export default AlertDialogCancel;
