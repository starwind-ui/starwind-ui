import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";

export type DialogProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  onCloseComplete?: (
    details: import("@starwind-ui/react/dialog").DialogCloseCompleteDetails,
  ) => void;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/dialog").DialogOpenChangeDetails,
  ) => void;
};

function Dialog(props: DialogProps) {
  const {
    defaultOpen = false,
    open,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    modal = true,
    onCloseComplete,
    onOpenChange,
    className,
    children,
    ...rest
  } = props;

  const rootClassName = className;

  return (
    <DialogPrimitive.Root
      className={rootClassName}
      defaultOpen={defaultOpen}
      open={open}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      modal={modal}
      onCloseComplete={onCloseComplete}
      onOpenChange={onOpenChange}
      {...rest}
      data-slot="dialog"
    >
      {children}
    </DialogPrimitive.Root>
  );
}

export default Dialog;
