import type * as React from "react";
import { sidebarContent } from "./variants";

export type SidebarContentProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarContent(props: SidebarContentProps) {
  const { ref, "data-slot": dataSlot = "sidebar-content", className, children, ...rest } = props;

  return (
    <div
      className={sidebarContent({ class: className })}
      data-sidebar="content"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarContent;
