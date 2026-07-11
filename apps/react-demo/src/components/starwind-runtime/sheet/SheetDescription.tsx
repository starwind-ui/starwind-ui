import SheetPrimitive from "@starwind-ui/react/drawer";
import type * as React from "react";
import { sheetDescription } from "./variants";

export type SheetDescriptionProps = React.ComponentPropsWithoutRef<"p">;

function SheetDescription(props: SheetDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <SheetPrimitive.Description
      className={sheetDescription({ class: className })}
      {...rest}
      data-slot="sheet-description"
    >
      {children}
    </SheetPrimitive.Description>
  );
}

export default SheetDescription;
