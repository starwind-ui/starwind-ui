import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import { navigationMenuItem } from "./variants";

export type NavigationMenuItemProps = React.ComponentPropsWithoutRef<"li"> & {
  value?: string;
};

function NavigationMenuItem(props: NavigationMenuItemProps) {
  const { value, className, children, ...rest } = props;

  return (
    <NavigationMenuPrimitive.Item
      className={navigationMenuItem({ class: className })}
      value={value}
      {...rest}
      data-slot="navigation-menu-item"
    >
      {children}
    </NavigationMenuPrimitive.Item>
  );
}

export default NavigationMenuItem;
