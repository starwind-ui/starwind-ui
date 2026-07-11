import ToastPrimitive from "@starwind-ui/react/toast";
import type * as React from "react";
import { toastAction } from "./variants";

export type ToastActionProps = React.ComponentPropsWithoutRef<"button">;

function ToastAction(props: ToastActionProps) {
  const { className, children, ...rest } = props;

  return (
    <ToastPrimitive.Action
      className={toastAction({ class: className })}
      {...rest}
      data-slot="toast-action"
    >
      {children}
    </ToastPrimitive.Action>
  );
}

export default ToastAction;
