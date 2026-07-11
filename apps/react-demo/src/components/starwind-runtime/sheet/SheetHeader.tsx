import type * as React from "react";
import { sheetHeader } from "./variants";

export type SheetHeaderProps = React.ComponentPropsWithoutRef<"div">;

function SheetHeader(props: SheetHeaderProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={sheetHeader({ class: className })} {...rest} data-slot="sheet-header">
      {children}
    </div>
  );
}

export default SheetHeader;
