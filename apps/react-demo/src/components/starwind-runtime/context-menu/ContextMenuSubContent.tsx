"use client";

import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuContent } from "./variants";

export type ContextMenuSubContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
};

function ContextMenuSubContent(props: ContextMenuSubContentProps) {
  const {
    className,
    side,
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
    <ContextMenuPrimitive.Portal
      container={portalContainer}
      disabled={disablePortal}
      data-slot="context-menu-sub-portal"
    >
      <ContextMenuPrimitive.Popup
        className={contextMenuContent({ class: subContentClassName })}
        side={side ?? "right"}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        data-sw-menu-side-intent={side ?? ""}
        {...rest}
        data-slot="context-menu-sub-content"
      >
        {children}
      </ContextMenuPrimitive.Popup>
    </ContextMenuPrimitive.Portal>
  );
}

export default ContextMenuSubContent;
