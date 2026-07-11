import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import type * as React from "react";
import NavigationMenuPositioner from "./NavigationMenuPositioner";
import { navigationMenu } from "./variants";

export type NavigationMenuProps = Omit<
  React.ComponentPropsWithoutRef<"nav">,
  "defaultValue" | "onChange" | "value"
> & {
  defaultValue?: string | null;
  value?: string | null;
  openDelay?: number;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  orientation?: "horizontal" | "vertical";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  onValueChange?: (
    value: string | null,
    details: import("@starwind-ui/react/navigation-menu").NavigationMenuValueChangeDetails,
  ) => void;
};

function NavigationMenu(props: NavigationMenuProps) {
  const {
    defaultValue = null,
    value,
    openDelay = 50,
    closeDelay = 50,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    orientation = "horizontal",
    side = "bottom",
    align = "start",
    sideOffset = 8,
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    onValueChange,
    className,
    children,
    ...rest
  } = props;

  return (
    <NavigationMenuPrimitive.Root
      className={navigationMenu({ class: className })}
      defaultValue={defaultValue}
      value={value}
      openDelay={openDelay}
      closeDelay={closeDelay}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      orientation={orientation}
      onValueChange={onValueChange}
      {...rest}
      data-slot="navigation-menu"
    >
      {children}

      <NavigationMenuPositioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
      />
    </NavigationMenuPrimitive.Root>
  );
}

export default NavigationMenu;
