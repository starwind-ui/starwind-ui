import type * as React from "react";
import { sidebarMenu } from "./variants";

export type SidebarMenuProps = React.ComponentPropsWithoutRef<"ul"> & {
  ref?: React.Ref<HTMLUListElement>;
  "data-slot"?: string;
};

function SidebarMenu(props: SidebarMenuProps) {
  const { ref, "data-slot": dataSlot = "sidebar-menu", className, children, ...rest } = props;

  return (
    <ul
      className={sidebarMenu({ class: className })}
      data-sidebar="menu"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </ul>
  );
}

export default SidebarMenu;
