import TooltipPrimitive from "@starwind-ui/react/tooltip";
import type * as React from "react";

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<"span"> & {
  asChild?: boolean;
  disabled?: boolean;
  ref?: React.Ref<HTMLSpanElement | HTMLButtonElement>;
};

function TooltipTrigger(props: TooltipTriggerProps) {
  const { asChild = true, disabled = false, ref, className, children, ...rest } = props;

  const triggerClassName = [asChild ? undefined : "inline-flex", className]
    .filter(Boolean)
    .join(" ");

  return (
    <TooltipPrimitive.Trigger
      className={triggerClassName}
      asChild={asChild}
      disabled={disabled}
      ref={ref}
      {...rest}
      data-slot="tooltip-trigger"
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
}

export default TooltipTrigger;
