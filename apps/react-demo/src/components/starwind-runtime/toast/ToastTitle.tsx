import ToastPrimitive from "@starwind-ui/react/toast";
import {
  IconAlertTriangle as AlertTriangle,
  IconCircleCheck as CircleCheck,
  IconCircleX as CircleX,
  IconInfoCircle as InfoCircle,
  IconLoader2 as Loader2,
} from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { toastTitle } from "./variants";

export type ToastTitleProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof toastTitle> & {
    icon?: React.ReactNode;
  };

function ToastTitle(props: ToastTitleProps) {
  const { className, variant = "default", children, icon, ...rest } = props;

  return (
    <ToastPrimitive.Title
      className={toastTitle({ variant, class: className })}
      {...rest}
      data-slot="toast-title"
    >
      {icon ?? (
        <>
          {variant === "success" && <CircleCheck />}

          {variant === "error" && <CircleX />}

          {variant === "warning" && <AlertTriangle />}

          {variant === "info" && <InfoCircle />}

          {variant === "loading" && <Loader2 className="animate-spin" />}
        </>
      )}

      <ToastPrimitive.TitleText data-slot="toast-title-text">{children}</ToastPrimitive.TitleText>
    </ToastPrimitive.Title>
  );
}

export default ToastTitle;
