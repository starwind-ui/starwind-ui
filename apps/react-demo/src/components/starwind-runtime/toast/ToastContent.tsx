import ToastPrimitive from "@starwind-ui/react/toast";
import type * as React from "react";
import { toastContent } from "./variants";

export type ToastContentProps = React.ComponentPropsWithoutRef<"div">;

function ToastContent(props: ToastContentProps) {
  const { className, children, ...rest } = props;

  return (
    <ToastPrimitive.Content
      className={toastContent({ class: className })}
      {...rest}
      data-slot="toast-content"
    >
      {children}
    </ToastPrimitive.Content>
  );
}

export default ToastContent;
