import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import { navigationMenuList } from "./variants";

export type NavigationMenuListProps = React.ComponentPropsWithoutRef<"ul">;

function NavigationMenuList(props: NavigationMenuListProps) {
  const { className, children, ...rest } = props;

  return (
    <NavigationMenuPrimitive.List
      className={navigationMenuList({ class: className })}
      {...rest}
      data-slot="navigation-menu-list"
    >
      {children}
    </NavigationMenuPrimitive.List>
  );
}

export default NavigationMenuList;
