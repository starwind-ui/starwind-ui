import type * as React from "react";
import { sidebarMenuSub } from "./variants";

export type SidebarMenuSubProps = React.ComponentPropsWithoutRef<"ul"> & {
  ref?: React.Ref<HTMLUListElement>;
  "data-slot"?: string;
};

function SidebarMenuSub(props: SidebarMenuSubProps) {
  const { ref, "data-slot": dataSlot = "sidebar-menu-sub", className, children, ...rest } = props;

  return (
    <ul
      className={sidebarMenuSub({ class: className })}
      data-sidebar="menu-sub"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </ul>
  );
}

export default SidebarMenuSub;
