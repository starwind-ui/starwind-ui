import ToastPrimitive from "@starwind-ui/react/toast";
import { IconX as X } from "@tabler/icons-react";
import type * as React from "react";
import { toastClose } from "./variants";

export type ToastCloseProps = React.ComponentPropsWithoutRef<"button"> & {
  showIcon?: boolean;
};

function ToastClose(props: ToastCloseProps) {
  const { className, showIcon = true, children, ...rest } = props;

  return (
    <ToastPrimitive.Close
      className={toastClose({ class: className })}
      {...rest}
      data-slot="toast-close"
    >
      {children}

      {showIcon && <X className="size-4" />}
    </ToastPrimitive.Close>
  );
}

export default ToastClose;
