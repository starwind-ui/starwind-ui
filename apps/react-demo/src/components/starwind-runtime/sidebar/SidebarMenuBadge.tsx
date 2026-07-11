import type * as React from "react";
import { sidebarMenuBadge } from "./variants";

export type SidebarMenuBadgeProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarMenuBadge(props: SidebarMenuBadgeProps) {
  const { ref, "data-slot": dataSlot = "sidebar-menu-badge", className, children, ...rest } = props;

  return (
    <div
      className={sidebarMenuBadge({ class: className })}
      data-sidebar="menu-badge"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarMenuBadge;
