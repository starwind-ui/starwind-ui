import type * as React from "react";
import { Separator } from "../separator";
import { sidebarSeparator } from "./variants";

export type SidebarSeparatorProps = React.ComponentProps<typeof Separator>;

function SidebarSeparator(props: SidebarSeparatorProps) {
  const { orientation = "horizontal", className, ...rest } = props;

  return (
    <Separator
      orientation={orientation}
      className={sidebarSeparator({ class: className })}
      data-sidebar="separator"
      {...rest}
      data-slot="sidebar-separator"
    />
  );
}

export default SidebarSeparator;
