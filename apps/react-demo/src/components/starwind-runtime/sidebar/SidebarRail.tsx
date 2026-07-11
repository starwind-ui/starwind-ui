import SidebarPrimitive from "@starwind-ui/react/sidebar";
import type * as React from "react";
import { sidebarRail } from "./variants";

export type SidebarRailProps = React.ComponentPropsWithoutRef<"button"> & {
  ref?: React.Ref<HTMLButtonElement>;
};

function SidebarRail(props: SidebarRailProps) {
  const { ref, className, ...rest } = props;

  return (
    <SidebarPrimitive.Rail
      className={sidebarRail({ class: className })}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      {...rest}
      ref={ref}
      data-slot="sidebar-rail"
    />
  );
}

export default SidebarRail;
