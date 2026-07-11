import type * as React from "react";
import { sidebarFooter } from "./variants";

export type SidebarFooterProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarFooter(props: SidebarFooterProps) {
  const { ref, "data-slot": dataSlot = "sidebar-footer", className, children, ...rest } = props;

  return (
    <div
      className={sidebarFooter({ class: className })}
      data-sidebar="footer"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarFooter;
