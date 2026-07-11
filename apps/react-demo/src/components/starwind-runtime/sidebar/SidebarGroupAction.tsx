import type * as React from "react";
import { Button } from "../button";
import { sidebarGroupAction } from "./variants";

export type SidebarGroupActionProps = React.ComponentProps<typeof Button>;

function SidebarGroupAction(props: SidebarGroupActionProps) {
  const { variant = "ghost", size = "icon-sm", className, children, ...rest } = props;

  return (
    <Button
      variant={variant}
      size={size}
      className={sidebarGroupAction({ class: className })}
      data-sidebar="group-action"
      {...rest}
      data-slot="sidebar-group-action"
    >
      {children}
    </Button>
  );
}

export default SidebarGroupAction;
