import type * as React from "react";
import { dialogHeader } from "./variants";

export type DialogHeaderProps = React.ComponentPropsWithoutRef<"div">;

function DialogHeader(props: DialogHeaderProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={dialogHeader({ class: className })} {...rest} data-slot="dialog-header">
      {children}
    </div>
  );
}

export default DialogHeader;
