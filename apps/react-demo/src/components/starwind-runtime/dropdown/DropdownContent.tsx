"use client";

import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownContent } from "./variants";

export type DropdownContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
};

function DropdownContent(props: DropdownContentProps) {
  const {
    className,
    side = "bottom",
    align = "start",
    sideOffset = 4,
    avoidCollisions = true,
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  } = props;

  return (
    <MenuPrimitive.Portal
      container={portalContainer}
      disabled={disablePortal}
      data-slot="dropdown-portal"
    >
      <MenuPrimitive.Popup
        className={dropdownContent({ class: className })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="dropdown-content"
      >
        {children}
      </MenuPrimitive.Popup>
    </MenuPrimitive.Portal>
  );
}

export default DropdownContent;
