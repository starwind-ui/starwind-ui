import type * as React from "react";
import { sidebarHeader } from "./variants";

export type SidebarHeaderProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarHeader(props: SidebarHeaderProps) {
  const { ref, "data-slot": dataSlot = "sidebar-header", className, children, ...rest } = props;

  return (
    <div
      className={sidebarHeader({ class: className })}
      data-sidebar="header"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarHeader;
