import DialogPrimitive from "@starwind-ui/react/dialog";
import type * as React from "react";

export type DialogTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function DialogTrigger(props: DialogTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={triggerClassName}
        data-as-child
        data-sw-dialog-target-id={targetId}
        {...asChildRest}
        data-slot="dialog-trigger"
        data-sw-dialog-trigger
      >
        {children}
      </div>
    );
  }

  return (
    <DialogPrimitive.Trigger
      className={triggerClassName}
      targetId={targetId}
      {...rest}
      data-slot="dialog-trigger"
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

export default DialogTrigger;
