import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import { navigationMenuPopup, navigationMenuPositioner, navigationMenuViewport } from "./variants";

export type NavigationMenuPositionerProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
};

function NavigationMenuPositioner(props: NavigationMenuPositionerProps) {
  const {
    side = "bottom",
    align = "start",
    sideOffset = 8,
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    className,
    ...rest
  } = props;

  return (
    <NavigationMenuPrimitive.Portal data-slot="navigation-menu-portal">
      <NavigationMenuPrimitive.Positioner
        className={navigationMenuPositioner({ class: className })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        {...rest}
        data-slot="navigation-menu-positioner"
      >
        <NavigationMenuPrimitive.Popup
          className={navigationMenuPopup()}
          data-slot="navigation-menu-popup"
        >
          <NavigationMenuPrimitive.Viewport
            className={navigationMenuViewport()}
            data-slot="navigation-menu-viewport"
          />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

export default NavigationMenuPositioner;
