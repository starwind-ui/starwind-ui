"use client";

import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuContent } from "./variants";

export type ContextMenuContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
};

function ContextMenuContent(props: ContextMenuContentProps) {
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
    <ContextMenuPrimitive.Portal
      container={portalContainer}
      disabled={disablePortal}
      data-slot="context-menu-portal"
    >
      <ContextMenuPrimitive.Popup
        className={contextMenuContent({ class: className })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="context-menu-content"
      >
        {children}
      </ContextMenuPrimitive.Popup>
    </ContextMenuPrimitive.Portal>
  );
}

export default ContextMenuContent;
