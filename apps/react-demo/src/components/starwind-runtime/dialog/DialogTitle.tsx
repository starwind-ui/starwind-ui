import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";
import { dialogTitle } from "./variants";

export type DialogTitleProps = React.ComponentPropsWithoutRef<"h2">;

function DialogTitle(props: DialogTitleProps) {
  const { className, children, ...rest } = props;

  return (
    <DialogPrimitive.Title
      className={dialogTitle({ class: className })}
      {...rest}
      data-slot="dialog-title"
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export default DialogTitle;
