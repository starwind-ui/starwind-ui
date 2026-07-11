import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import { navigationMenuContent } from "./variants";

export type NavigationMenuContentProps = React.ComponentPropsWithoutRef<"div">;

function NavigationMenuContent(props: NavigationMenuContentProps) {
  const { className, children, ...rest } = props;

  return (
    <NavigationMenuPrimitive.Content
      className={navigationMenuContent({ class: className })}
      {...rest}
      data-slot="navigation-menu-content"
    >
      {children}
    </NavigationMenuPrimitive.Content>
  );
}

export default NavigationMenuContent;
