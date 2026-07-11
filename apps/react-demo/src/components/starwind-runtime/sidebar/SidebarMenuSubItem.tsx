import type * as React from "react";
import { sidebarMenuSubItem } from "./variants";

export type SidebarMenuSubItemProps = React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
  "data-slot"?: string;
};

function SidebarMenuSubItem(props: SidebarMenuSubItemProps) {
  const {
    ref,
    "data-slot": dataSlot = "sidebar-menu-sub-item",
    className,
    children,
    ...rest
  } = props;

  return (
    <li
      className={sidebarMenuSubItem({ class: className })}
      data-sidebar="menu-sub-item"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </li>
  );
}

export default SidebarMenuSubItem;
