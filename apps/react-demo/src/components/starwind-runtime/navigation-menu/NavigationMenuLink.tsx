import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import { navigationMenuLink } from "./variants";

export type NavigationMenuLinkProps = React.ComponentPropsWithoutRef<"a"> & {
  active?: boolean;
  closeOnClick?: boolean;
};

function NavigationMenuLink(props: NavigationMenuLinkProps) {
  const { active = false, closeOnClick = true, className, children, ...rest } = props;

  return (
    <NavigationMenuPrimitive.Link
      className={navigationMenuLink({ class: className })}
      active={active}
      closeOnClick={closeOnClick}
      {...rest}
      data-slot="navigation-menu-link"
    >
      {children}
    </NavigationMenuPrimitive.Link>
  );
}

export default NavigationMenuLink;
