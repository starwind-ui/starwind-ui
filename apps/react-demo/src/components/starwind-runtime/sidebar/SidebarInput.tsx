import type * as React from "react";
import { Input } from "../input";
import { sidebarInput } from "./variants";

export type SidebarInputProps = React.ComponentProps<typeof Input>;

function SidebarInput(props: SidebarInputProps) {
  const { size = "md", className, ...rest } = props;

  return (
    <Input
      size={size}
      className={sidebarInput({ class: className })}
      data-sidebar="input"
      {...rest}
      data-slot="sidebar-input"
    />
  );
}

export default SidebarInput;
