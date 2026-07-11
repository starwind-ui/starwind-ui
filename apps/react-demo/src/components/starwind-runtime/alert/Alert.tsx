import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { alert } from "./variants";

export type AlertProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof alert> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function Alert(props: AlertProps) {
  const { variant, role, ref, className, children, ...rest } = props;

  const inferredRole = role ?? (variant === "error" || variant === "warning" ? "alert" : "status");

  return (
    <div
      data-sw-alert
      className={alert({ variant, class: className })}
      role={inferredRole}
      {...rest}
      ref={ref}
      data-slot="alert"
    >
      {children}
    </div>
  );
}

export default Alert;
