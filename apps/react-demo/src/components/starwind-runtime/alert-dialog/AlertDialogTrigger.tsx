"use client";

import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";

export type AlertDialogTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;

  return (
    <AlertDialogPrimitive.Trigger
      asChild={asChild}
      className={triggerClassName}
      targetId={targetId}
      {...rest}
      data-slot="alert-dialog-trigger"
    >
      {children}
    </AlertDialogPrimitive.Trigger>
  );
}

export default AlertDialogTrigger;
