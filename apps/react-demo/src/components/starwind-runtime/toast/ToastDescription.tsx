import ToastPrimitive from "@starwind-ui/react/toast";
import type * as React from "react";
import { toastDescription } from "./variants";

export type ToastDescriptionProps = React.ComponentPropsWithoutRef<"div">;

function ToastDescription(props: ToastDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <ToastPrimitive.Description
      className={toastDescription({ class: className })}
      {...rest}
      data-slot="toast-description"
    >
      {children}
    </ToastPrimitive.Description>
  );
}

export default ToastDescription;
