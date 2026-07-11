import ToastPrimitive from "@starwind-ui/react/toast";
import {
  IconAlertTriangle as AlertTriangle,
  IconCircleCheck as CircleCheck,
  IconCircleX as CircleX,
  IconInfoCircle as InfoCircle,
  IconLoader2 as Loader2,
  IconX as X,
} from "@tabler/icons-react";
import type * as React from "react";
import {
  toastAction,
  toastClose,
  toastContent,
  toastDescription,
  toastItem,
  toastTitle,
} from "./variants";

export type ToastTemplateProps = React.ComponentPropsWithoutRef<"template"> & {
  variant?: "default" | "error" | "info" | "loading" | "success" | "warning";
};

function ToastTemplate(props: ToastTemplateProps) {
  const { variant = "default", children, ...rest } = props;

  return (
    <ToastPrimitive.Template variant={variant} {...rest}>
      {children ?? (
        <ToastPrimitive.Root
          className={toastItem({ variant: variant === "loading" ? "default" : variant })}
          variant={variant === "loading" ? "default" : variant}
          data-slot="toast"
        >
          <ToastPrimitive.Content className={toastContent()} data-slot="toast-content">
            <ToastPrimitive.Title className={toastTitle({ variant })} data-slot="toast-title">
              {variant === "success" && <CircleCheck />}

              {variant === "error" && <CircleX />}

              {variant === "warning" && <AlertTriangle />}

              {variant === "info" && <InfoCircle />}

              {variant === "loading" && <Loader2 className="animate-spin" />}

              <ToastPrimitive.TitleText data-slot="toast-title-text">
                Title
              </ToastPrimitive.TitleText>
            </ToastPrimitive.Title>

            <ToastPrimitive.Description
              className={toastDescription()}
              data-slot="toast-description"
            >
              Description
            </ToastPrimitive.Description>

            <ToastPrimitive.Action className={toastAction()} data-slot="toast-action">
              Action
            </ToastPrimitive.Action>
          </ToastPrimitive.Content>

          <ToastPrimitive.Close className={toastClose()} data-slot="toast-close">
            <X className="size-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      )}
    </ToastPrimitive.Template>
  );
}

export default ToastTemplate;
