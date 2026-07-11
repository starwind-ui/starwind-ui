import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuContent } from "./variants";

export type ContextMenuSubContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
};

function ContextMenuSubContent(props: ContextMenuSubContentProps) {
  const {
    className,
    side = "right",
    align = "start",
    sideOffset = 0,
    avoidCollisions = true,
    children,
    ...rest
  } = props;

  const subContentClassName = className;

  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-sub-portal">
      <ContextMenuPrimitive.Popup
        className={contextMenuContent({ class: subContentClassName })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="context-menu-sub-content"
      >
        {children}
      </ContextMenuPrimitive.Popup>
    </ContextMenuPrimitive.Portal>
  );
}

export default ContextMenuSubContent;
