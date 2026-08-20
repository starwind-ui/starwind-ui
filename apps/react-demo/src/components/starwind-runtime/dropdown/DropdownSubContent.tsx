"use client";

import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownContent } from "./variants";

export type DropdownSubContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
};

function DropdownSubContent(props: DropdownSubContentProps) {
  const {
    className,
    side = "right",
    align = "start",
    sideOffset = 0,
    avoidCollisions = true,
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  } = props;

  const subContentClassName = className;

  return (
    <MenuPrimitive.Portal
      container={portalContainer}
      disabled={disablePortal}
      data-slot="dropdown-sub-portal"
    >
      <MenuPrimitive.Popup
        className={dropdownContent({ class: subContentClassName })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="dropdown-sub-content"
      >
        {children}
      </MenuPrimitive.Popup>
    </MenuPrimitive.Portal>
  );
}

export default DropdownSubContent;
