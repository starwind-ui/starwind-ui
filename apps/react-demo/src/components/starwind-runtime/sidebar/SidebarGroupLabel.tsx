import type * as React from "react";
import { sidebarGroupLabel } from "./variants";

export type SidebarGroupLabelProps = React.ComponentPropsWithoutRef<"div"> & {
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function SidebarGroupLabel(props: SidebarGroupLabelProps) {
  const { asChild = false, ref, className, children, ...rest } = props;

  const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div
      className={sidebarGroupLabel({ class: className })}
      data-sidebar="group-label"
      data-as-child={asChild ? true : undefined}
      {...asChildRest}
      ref={ref}
      data-slot="sidebar-group-label"
    >
      {children}
    </div>
  );
}

export default SidebarGroupLabel;
