import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";

export type DialogCloseProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function DialogClose(props: DialogCloseProps) {
  const { asChild = false, className, children, ...rest } = props;

  const closeClassName = className;
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={closeClassName}
        data-as-child
        {...asChildRest}
        data-slot="dialog-close"
        data-sw-dialog-close
      >
        {children}
      </div>
    );
  }

  return (
    <DialogPrimitive.Close className={closeClassName} {...rest} data-slot="dialog-close">
      {children ?? "Close"}
    </DialogPrimitive.Close>
  );
}

export default DialogClose;
