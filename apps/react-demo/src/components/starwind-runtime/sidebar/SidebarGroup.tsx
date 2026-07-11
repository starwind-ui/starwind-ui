import type * as React from "react";
import { sidebarGroup } from "./variants";

export type SidebarGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarGroup(props: SidebarGroupProps) {
  const { ref, "data-slot": dataSlot = "sidebar-group", className, children, ...rest } = props;

  return (
    <div
      className={sidebarGroup({ class: className })}
      data-sidebar="group"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarGroup;
