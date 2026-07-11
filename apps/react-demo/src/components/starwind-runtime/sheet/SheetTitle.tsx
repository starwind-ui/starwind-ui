import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";
import { sheetTitle } from "./variants";

export type SheetTitleProps = React.ComponentPropsWithoutRef<"h2">;

function SheetTitle(props: SheetTitleProps) {
  const { className, children, ...rest } = props;

  return (
    <SheetPrimitive.Title
      className={sheetTitle({ class: className })}
      {...rest}
      data-slot="sheet-title"
    >
      {children}
    </SheetPrimitive.Title>
  );
}

export default SheetTitle;
