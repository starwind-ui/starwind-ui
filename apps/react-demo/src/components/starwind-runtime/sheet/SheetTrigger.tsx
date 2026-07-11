import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";

export type SheetTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  targetId?: string;
};

function SheetTrigger(props: SheetTriggerProps) {
  const { asChild = false, targetId, className, children, ...rest } = props;

  const triggerClassName = className;
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={triggerClassName}
        data-as-child
        data-sw-drawer-target-id={targetId}
        {...asChildRest}
        data-slot="sheet-trigger"
        data-sw-drawer-trigger
      >
        {children}
      </div>
    );
  }

  return (
    <SheetPrimitive.Trigger
      className={triggerClassName}
      targetId={targetId}
      {...rest}
      data-slot="sheet-trigger"
    >
      {children}
    </SheetPrimitive.Trigger>
  );
}

export default SheetTrigger;
