import type * as React from "react";
import { sidebarGroupContent } from "./variants";

export type SidebarGroupContentProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarGroupContent(props: SidebarGroupContentProps) {
  const {
    ref,
    "data-slot": dataSlot = "sidebar-group-content",
    className,
    children,
    ...rest
  } = props;

  return (
    <div
      className={sidebarGroupContent({ class: className })}
      data-sidebar="group-content"
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </div>
  );
}

export default SidebarGroupContent;
