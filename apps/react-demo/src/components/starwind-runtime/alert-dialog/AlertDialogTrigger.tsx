import AlertDialogPrimitive from "@starwind-ui/react/alert-dialog";
import type * as React from "react";

export type AlertDialogTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={triggerClassName}
        data-as-child
        data-sw-alert-dialog-target-id={targetId}
        {...asChildRest}
        data-slot="alert-dialog-trigger"
        data-sw-alert-dialog-trigger
      >
        {children}
      </div>
    );
  }

  return (
    <AlertDialogPrimitive.Trigger
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
