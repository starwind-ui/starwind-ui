import type * as React from "react";
import { sidebarInset } from "./variants";

export type SidebarInsetProps = React.ComponentPropsWithoutRef<"main"> & {
  ref?: React.Ref<HTMLDivElement>;
  "data-slot"?: string;
};

function SidebarInset(props: SidebarInsetProps) {
  const { ref, "data-slot": dataSlot = "sidebar-inset", className, children, ...rest } = props;

  return (
    <main className={sidebarInset({ class: className })} {...rest} ref={ref} data-slot={dataSlot}>
      {children}
    </main>
  );
}

export default SidebarInset;
