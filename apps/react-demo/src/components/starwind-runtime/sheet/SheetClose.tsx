"use client";

import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";

export type SheetCloseProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function SheetClose(props: SheetCloseProps) {
  const { asChild = false, className, children, ...rest } = props;

  const closeClassName = className;

  return (
    <SheetPrimitive.Close
      asChild={asChild}
      className={closeClassName}
      {...rest}
      data-slot="sheet-close"
    >
      {children ?? "Close"}
    </SheetPrimitive.Close>
  );
}

export default SheetClose;
