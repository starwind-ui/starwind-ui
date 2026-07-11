import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { sidebarMenuSubButton } from "./variants";

export type SidebarMenuSubButtonProps = React.ComponentPropsWithoutRef<"a"> &
  VariantProps<typeof sidebarMenuSubButton> & {
    isActive?: boolean;
    ref?: React.Ref<HTMLAnchorElement>;
  };

function SidebarMenuSubButton(props: SidebarMenuSubButtonProps) {
  const { size = "md", isActive = false, ref, className, children, ...rest } = props;

  return (
    <a
      className={sidebarMenuSubButton({ size, class: className })}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      {...rest}
      ref={ref}
      data-slot="sidebar-menu-sub-button"
    >
      {children}
    </a>
  );
}

export default SidebarMenuSubButton;
