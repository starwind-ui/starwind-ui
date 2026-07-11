import type * as React from "react";
import { popoverHeader } from "./variants";

export type PopoverHeaderProps = React.ComponentPropsWithoutRef<"div">;

function PopoverHeader(props: PopoverHeaderProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={popoverHeader({ class: className })} {...rest} data-slot="popover-header">
      {children}
    </div>
  );
}

export default PopoverHeader;
