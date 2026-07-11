import type * as React from "react";
import { sheetFooter } from "./variants";

export type SheetFooterProps = React.ComponentPropsWithoutRef<"div">;

function SheetFooter(props: SheetFooterProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={sheetFooter({ class: className })} {...rest} data-slot="sheet-footer">
      {children}
    </div>
  );
}

export default SheetFooter;
