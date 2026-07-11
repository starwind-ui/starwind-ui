import type * as React from "react";
import { dialogFooter } from "./variants";

export type DialogFooterProps = React.ComponentPropsWithoutRef<"div">;

function DialogFooter(props: DialogFooterProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={dialogFooter({ class: className })} {...rest} data-slot="dialog-footer">
      {children}
    </div>
  );
}

export default DialogFooter;
