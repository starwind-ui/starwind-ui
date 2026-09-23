"use client";

import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";

export type SheetTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function SheetTrigger(props: SheetTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;

  return (
    <SheetPrimitive.Trigger
      asChild={asChild}
      className={triggerClassName}
      targetId={targetId}
      {...rest}
      data-slot="sheet-trigger"
    >
      {children}
    </SheetPrimitive.Trigger>
  );
}

export default SheetTrigger;
