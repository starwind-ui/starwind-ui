import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import { navigationMenuIndicator } from "./variants";

export type NavigationMenuIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function NavigationMenuIndicator(props: NavigationMenuIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <NavigationMenuPrimitive.Icon
      className={navigationMenuIndicator({ class: className })}
      {...rest}
      data-slot="navigation-menu-indicator"
    >
      {children ?? <ChevronDown />}
    </NavigationMenuPrimitive.Icon>
  );
}

export default NavigationMenuIndicator;
