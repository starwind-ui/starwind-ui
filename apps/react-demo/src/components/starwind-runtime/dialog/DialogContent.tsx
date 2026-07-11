import type * as React from "react";
import "./styles.css";
import DialogPrimitive from "@starwind-ui/react/dialog";
import { IconX as X } from "@tabler/icons-react";
import { Button } from "../button";
import { dialogBackdrop, dialogCloseButton, dialogContent } from "./variants";

export type DialogContentProps = React.ComponentPropsWithoutRef<"dialog"> & {
  backdrop?: React.ReactNode;
  icon?: React.ReactNode;
};

function DialogContent(props: DialogContentProps) {
  const { className, children, backdrop, icon, ...rest } = props;

  return (
    <>
      {backdrop ?? (
        <DialogPrimitive.Backdrop
          className={dialogBackdrop()}
          data-state="closed"
          hidden
          data-slot="dialog-backdrop"
        />
      )}

      <DialogPrimitive.Popup
        className={dialogContent({ class: className })}
        data-state="closed"
        {...rest}
        data-slot="dialog-content"
      >
        {children}

        <Button
          variant="ghost"
          size="icon-sm"
          className={dialogCloseButton()}
          aria-label="Close dialog"
          data-slot="dialog-close"
          data-sw-dialog-close
        >
          {icon ?? <X className="size-5 transition-opacity" />}

          <span className="sr-only">Close</span>
        </Button>
      </DialogPrimitive.Popup>
    </>
  );
}

export default DialogContent;
