import SidebarPrimitive from "@starwind-ui/react/sidebar";
import { IconLayoutSidebar as LayoutSidebar } from "@tabler/icons-react";
import type * as React from "react";
import { Button } from "../button";
import { sidebarTrigger } from "./variants";

export type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
};

function SidebarTrigger(props: SidebarTriggerProps) {
  const { size = "icon-sm", variant = "ghost", className, icon, ...rest } = props;

  return (
    <SidebarPrimitive.Trigger asChild={true}>
      <Button
        variant={variant}
        size={size}
        className={sidebarTrigger({ class: className })}
        data-sidebar="trigger"
        aria-label="Toggle Sidebar"
        {...rest}
        data-slot="sidebar-trigger"
      >
        {icon ?? <LayoutSidebar aria-hidden="true" />}

        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </SidebarPrimitive.Trigger>
  );
}

export default SidebarTrigger;
