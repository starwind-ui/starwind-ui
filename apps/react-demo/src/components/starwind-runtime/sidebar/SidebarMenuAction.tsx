import type * as React from "react";
import { Button } from "../button";
import { sidebarMenuAction } from "./variants";

export type SidebarMenuActionProps = React.ComponentProps<typeof Button> & {
  showOnHover?: boolean;
};

function SidebarMenuAction(props: SidebarMenuActionProps) {
  const {
    showOnHover = false,
    variant = "ghost",
    size = "icon-sm",
    className,
    children,
    ...rest
  } = props;

  return (
    <Button
      variant={variant}
      size={size}
      className={sidebarMenuAction({ showOnHover, class: className })}
      data-sidebar="menu-action"
      {...rest}
      data-slot="sidebar-menu-action"
    >
      {children}
    </Button>
  );
}

export default SidebarMenuAction;
