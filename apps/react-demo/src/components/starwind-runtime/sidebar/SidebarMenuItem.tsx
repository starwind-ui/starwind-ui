import type * as React from "react";
import { sidebarMenuItem } from "./variants";

export type SidebarMenuItemProps = React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
  "data-slot"?: string;
};

function SidebarMenuItem(props: SidebarMenuItemProps) {
  const { ref, "data-slot": dataSlot = "sidebar-menu-item", className, children, ...rest } = props;

  return (
    <li
      className={sidebarMenuItem({ class: className })}
      data-sidebar="menu-item"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </li>
  );
}

export default SidebarMenuItem;
