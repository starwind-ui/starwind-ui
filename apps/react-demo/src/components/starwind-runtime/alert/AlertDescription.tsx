import type * as React from "react";
import { alertDescription } from "./variants";

export type AlertDescriptionProps = React.ComponentPropsWithoutRef<"p"> & {
  ref?: React.Ref<HTMLParagraphElement>;
};

function AlertDescription(props: AlertDescriptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <p
      data-sw-alert-description
      className={alertDescription({ class: className })}
      {...rest}
      ref={ref}
      data-slot="alert-description"
    >
      {children}
    </p>
  );
}

export default AlertDescription;
