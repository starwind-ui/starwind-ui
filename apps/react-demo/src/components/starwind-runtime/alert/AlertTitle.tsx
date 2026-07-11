import type * as React from "react";
import { alertTitle } from "./variants";

export type AlertTitleProps = React.ComponentPropsWithoutRef<"h5"> & {
  ref?: React.Ref<HTMLHeadingElement>;
};

function AlertTitle(props: AlertTitleProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <h5
      data-sw-alert-title
      className={alertTitle({ class: className })}
      {...rest}
      ref={ref}
      data-slot="alert-title"
    >
      {children}
    </h5>
  );
}

export default AlertTitle;
