import ToastPrimitive from "@starwind-ui/react/toast";
import { IconX as X } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { toastClose, toastContent, toastItem } from "./variants";

export type ToastItemProps = React.ComponentPropsWithoutRef<"div"> & VariantProps<typeof toastItem>;

function ToastItem(props: ToastItemProps) {
  const { className, variant = "default", children, ...rest } = props;

  return (
    <ToastPrimitive.Root
      className={toastItem({ variant, class: className })}
      variant={variant}
      {...rest}
      data-slot="toast"
    >
      <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
        {children}
      </ToastPrimitive.Content>

      <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
        <X className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export default ToastItem;
