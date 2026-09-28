"use client";

import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";

export type DialogTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function DialogTrigger(props: DialogTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;

  return (
    <DialogPrimitive.Trigger
      asChild={asChild}
      className={triggerClassName}
      targetId={targetId}
      {...rest}
      data-slot="dialog-trigger"
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

export default DialogTrigger;
