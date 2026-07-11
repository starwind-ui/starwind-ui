import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";

export type SheetCloseProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function SheetClose(props: SheetCloseProps) {
  const { asChild = false, className, children, ...rest } = props;

  const closeClassName = className;
  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  if (asChild) {
    return (
      <div
        className={closeClassName}
        data-as-child
        {...asChildRest}
        data-slot="sheet-close"
        data-sw-drawer-close
      >
        {children}
      </div>
    );
  }

  return (
    <SheetPrimitive.Close className={closeClassName} {...rest} data-slot="sheet-close">
      {children ?? "Close"}
    </SheetPrimitive.Close>
  );
}

export default SheetClose;
