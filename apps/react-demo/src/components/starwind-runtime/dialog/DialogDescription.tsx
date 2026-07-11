import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";
import { dialogDescription } from "./variants";

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<"p">;

function DialogDescription(props: DialogDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <DialogPrimitive.Description
      className={dialogDescription({ class: className })}
      {...rest}
      data-slot="dialog-description"
    >
      {children}
    </DialogPrimitive.Description>
  );
}

export default DialogDescription;
