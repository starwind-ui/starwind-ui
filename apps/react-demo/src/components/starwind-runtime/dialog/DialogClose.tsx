"use client";

import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";

export type DialogCloseProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function DialogClose(props: DialogCloseProps) {
  const { asChild = false, className, children, ...rest } = props;

  const closeClassName = className;

  return (
    <DialogPrimitive.Close
      asChild={asChild}
      className={closeClassName}
      {...rest}
      data-slot="dialog-close"
    >
      {children ?? "Close"}
    </DialogPrimitive.Close>
  );
}

export default DialogClose;
